import { ipcMain } from 'electron';
import { UserRepository } from '../repositories/user.repo';

export const registerUserHandlers = (repo: UserRepository) => {
  ipcMain.handle('auth:login', async (_, pin: string) => {
    const user = await repo.verifyPin(pin);
    if (!user) throw new Error('Invalid PIN');
    return { id: user.id, name: user.name, role: user.role };
  });
};
