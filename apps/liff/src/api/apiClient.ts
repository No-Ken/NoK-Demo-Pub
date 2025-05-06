import { Configuration, WarikanApi, ScheduleApi, SharedMemoApi, PersonalMemoApi } from './generated';
import apiClient from './axiosInstance';

const config = new Configuration({
  basePath: '/api/v1', // OpenAPI仕様書のserversに合わせる
  // ★ 認証トークンは後でグローバルに設定する
});

// 設定済み Axios インスタンスを渡して各 API クライアントを生成
export const warikanApi = new WarikanApi(config, undefined, apiClient);
export const scheduleApi = new ScheduleApi(config, undefined, apiClient);
export const sharedMemoApi = new SharedMemoApi(config, undefined, apiClient);
export const personalMemoApi = new PersonalMemoApi(config, undefined, apiClient);

// ★ 認証トークンを動的に設定するヘルパー関数
export function setApiAuthToken(token: string | null) {
  config.accessToken = token || undefined;
}

// 使用例：
// import { warikanApi } from './api/apiClient';
// 
// async function createProject(name: string) {
//   try {
//     const response = await warikanApi.createWarikanProject({ projectName: name });
//     return response.data;
//   } catch (error) {
//     console.error('Failed to create project:', error);
//     throw error;
//   }
// } 