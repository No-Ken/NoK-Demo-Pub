import ScheduleService from './schedule.service';
import WarikanService from './warikan.service';
import PersonalMemoService from './personalMemo.service';
import SharedMemoService from './sharedMemo.service';
import AuthService from './auth.service';
import ChatContextService from './chatContextService';
import MessageLogService from './messageLog.service';

// シングルトンインスタンスの作成
export const scheduleService = new ScheduleService();
export const warikanService = new WarikanService();
export const personalMemoService = new PersonalMemoService();
export const sharedMemoService = new SharedMemoService();
export const authService = new AuthService();
export const chatContextService = new ChatContextService();
export const messageLogService = new MessageLogService(); 