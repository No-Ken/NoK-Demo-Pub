import { firestore } from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import {
  ScheduleDoc,
  scheduleDocSchema,
  ScheduleVoteDoc,
  scheduleVoteDocSchema,
  ScheduleParticipantDoc,
  scheduleParticipantDocSchema,
} from '@task/types/firestore-types';

export default class ScheduleRepository {
  private db = firestore();
  private col = this.db.collection('schedules') as FirebaseFirestore.CollectionReference<ScheduleDoc>;
  private participantCol(id: string) { return this.col.doc(id).collection('scheduleParticipants') as FirebaseFirestore.CollectionReference<ScheduleParticipantDoc>; }
  private voteCol(id: string) { return this.col.doc(id).collection('scheduleVotes') as FirebaseFirestore.CollectionReference<ScheduleVoteDoc>; }

  private genOptionId() {
    return `opt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
  }

  async isOwner(id: string, userId: string): Promise<boolean> {
    const schedule = await this.getScheduleById(id);
    return !!schedule && schedule.createdBy === userId;
  }

  async isParticipant(id: string, userId: string): Promise<boolean> {
    const schedule = await this.getScheduleById(id);
    if (!schedule) return false;
    return (await this.participantCol(id).doc(userId).get()).exists;
  }

  async isParticipantOrOwner(id: string, userId: string): Promise<boolean> {
    const schedule = await this.getScheduleById(id);
    if (!schedule) return false;
    if (schedule.createdBy === userId) return true;
    return (await this.participantCol(id).doc(userId).get()).exists;
  }

  async createSchedule(userId: string, input: { title: string; description?: string }) {
    const now = Timestamp.now();
    const data: ScheduleDoc = {
      title: input.title,
      description: input.description ?? null,
      status: 'adjusting',
      createdBy: userId,
      groupId: null,
      createdAt: now,
      updatedAt: now,
      candidateDates: [],
      confirmedDateTime: null,
      isArchived: false,
    };
    const parsedData = scheduleDocSchema.parse(data);
    const ref = await this.col.add(parsedData);

    const participantData: ScheduleParticipantDoc = {
      scheduleId: ref.id,
      isGuest: false,
      lineUserId: userId,
      displayName: '作成者',
      addedAt: now,
    };
    const parsedParticipantData = scheduleParticipantDocSchema.parse(participantData);
    await this.participantCol(ref.id).doc(userId).set(parsedParticipantData);

    return { id: ref.id, ...parsedData };
  }

  async getScheduleById(id: string): Promise<(ScheduleDoc & { id: string }) | null> {
    const snap = await this.col.doc(id).get();
    if (!snap.exists) return null;
    try {
      const data = scheduleDocSchema.parse(snap.data());
      if (data.isArchived) return null;
      return { id: snap.id, ...data };
    } catch (error) {
        console.error(`Firestore data validation failed for schedule ${id}:`, error);
        return null;
    }
  }

  async addParticipant(id: string, input: { displayName: string; lineUserId?: string | null }) {
    const now = Timestamp.now();
    const participantId = input.lineUserId ?? `guest_${this.db.collection('_').doc().id}`;
    const data: ScheduleParticipantDoc = {
      scheduleId: id,
      isGuest: !input.lineUserId,
      lineUserId: input.lineUserId ?? null,
      displayName: input.displayName,
      addedAt: now,
    };
    const parsedData = scheduleParticipantDocSchema.parse(data);
    await this.participantCol(id).doc(participantId).set(parsedData);
    console.log(`Added participant ${participantId} to schedule ${id}`);
  }

  async addCandidateDates(id: string, isoDates: string[]) {
    const ref = this.col.doc(id);
    const now = Timestamp.now();
    const newCandidates = isoDates.map((d) => ({
      optionId: this.genOptionId(),
      datetime: Timestamp.fromDate(new Date(d)),
    }));

    await ref.update({
      candidateDates: firestore.FieldValue.arrayUnion(...newCandidates),
      updatedAt: now,
    });
    console.log(`Added ${newCandidates.length} candidates to schedule ${id}`);
  }

  async addOrUpdateVote(
    id: string,
    userId: string,
    input: { optionId: string; vote: 'ok' | 'maybe' | 'ng'; comment?: string },
  ) {
    const voteCol = this.voteCol(id);
    const docId = `${userId}_${input.optionId}`;
    const now = Timestamp.now();
    const data: ScheduleVoteDoc = {
      scheduleId: id,
      optionId: input.optionId,
      participantId: userId,
      vote: input.vote,
      comment: input.comment ?? null,
      votedAt: now,
    };
    const parsedData = scheduleVoteDocSchema.parse(data);
    await voteCol.doc(docId).set(parsedData, { merge: true });
    console.log(`Added/Updated vote for ${docId} in schedule ${id}`);

    await this.col.doc(id).update({ updatedAt: now });
  }

  async confirmSchedule(id: string): Promise<void> {
    const now = Timestamp.now();
    await this.col.doc(id).update({ status: 'confirmed', updatedAt: now });
    console.log(`Confirmed schedule ${id}`);
  }

  async archiveSchedule(id: string): Promise<void> {
    const now = Timestamp.now();
    await this.col.doc(id).update({ isArchived: true, updatedAt: now });
    console.log(`Archived schedule ${id}`);
  }
}