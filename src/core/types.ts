export interface Account { pageName: string; profileImg: string; logoImg: string }
export const uid = () => Math.random().toString(36).slice(2, 10)
