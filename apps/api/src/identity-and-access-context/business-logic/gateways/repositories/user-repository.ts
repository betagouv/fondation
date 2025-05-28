import { User } from '../../models/user';

export interface UserRepository {
  save(user: User): Promise<void>;
  userWithEmail(email: string): Promise<User | null>;
  userWithId(userId: string): Promise<User | null>;
  userWithFullName(firstName: string, lastName: string): Promise<User | null>;
}
