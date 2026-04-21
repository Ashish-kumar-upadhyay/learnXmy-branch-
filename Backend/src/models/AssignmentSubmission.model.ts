import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAssignmentSubmission extends Document {
  assignment_id: Types.ObjectId;
  student_id: Types.ObjectId;
  submission_link?: string;
  grade?: number;
  feedback?: string;
  submitted_at: Date;
  graded_at?: Date;
}

const AssignmentSubmissionSchema = new Schema<IAssignmentSubmission>(
  {
    assignment_id: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
    student_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    submission_link: { type: String },
    grade: { type: Number },
    feedback: { type: String },
    submitted_at: { type: Date, default: Date.now },
    graded_at: { type: Date },
  },
  { collection: 'assignment_submissions' }
);

AssignmentSubmissionSchema.index({ assignment_id: 1, student_id: 1 }, { unique: true });

export const AssignmentSubmission = mongoose.model<IAssignmentSubmission>(
  'AssignmentSubmission',
  AssignmentSubmissionSchema
);
