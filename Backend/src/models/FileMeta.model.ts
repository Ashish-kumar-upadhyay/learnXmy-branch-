import mongoose, { Schema, Document, Types } from 'mongoose';

/** Tracks uploaded files for avatar / selfie URLs served by this API */
export interface IFileMeta extends Document {
  owner_id: Types.ObjectId;
  kind: 'avatar' | 'selfie' | 'other';
  path: string;
  mime: string;
  size: number;
  original_name?: string;
  created_at: Date;
}

const FileMetaSchema = new Schema<IFileMeta>(
  {
    owner_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: { type: String, enum: ['avatar', 'selfie', 'other'], required: true },
    path: { type: String, required: true },
    mime: { type: String, required: true },
    size: { type: Number, required: true },
    original_name: { type: String },
    created_at: { type: Date, default: Date.now },
  },
  { collection: 'file_meta' }
);

export const FileMeta = mongoose.model<IFileMeta>('FileMeta', FileMetaSchema);
