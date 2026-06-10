export interface IUser {
  id: string;
  name: string;
  email: string;
  password?: string | null;
  premiumStatus: string;
  institution: string;
  avatar: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface IUpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  premiumStatus?: string;
  institution?: string;
  avatar?: string;
}
