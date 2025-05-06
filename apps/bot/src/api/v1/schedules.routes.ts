import { Router } from 'express';
import { ensureAuthenticated } from '../../middlewares/auth.middleware';
import ScheduleController from '../../controllers/schedule.controller';

const router = Router();
const controller = new ScheduleController();

// スケジュール調整関連
router.post('/schedules', ensureAuthenticated, controller.createSchedule);
router.get('/schedules', ensureAuthenticated, controller.listSchedules);
router.get('/schedules/:scheduleId', ensureAuthenticated, controller.getSchedule);
router.put('/schedules/:scheduleId', ensureAuthenticated, controller.updateSchedule);
router.delete('/schedules/:scheduleId', ensureAuthenticated, controller.deleteSchedule);

// 候補日時関連
router.post('/schedules/:scheduleId/dates', ensureAuthenticated, controller.addDateOption);
router.get('/schedules/:scheduleId/dates', ensureAuthenticated, controller.listDateOptions);
router.delete('/schedules/:scheduleId/dates/:dateId', ensureAuthenticated, controller.deleteDateOption);

// 参加者関連
router.post('/schedules/:scheduleId/participants', ensureAuthenticated, controller.addParticipant);
router.get('/schedules/:scheduleId/participants', ensureAuthenticated, controller.listParticipants);
router.put('/schedules/:scheduleId/participants/:userId', ensureAuthenticated, controller.updateParticipantAvailability);
router.delete('/schedules/:scheduleId/participants/:userId', ensureAuthenticated, controller.removeParticipant);

export default router;