import { Types } from 'mongoose';

export type UserDocument = {
  _id: Types.ObjectId;
  email: string;
  full_name: string;
};
