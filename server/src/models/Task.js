import mongoose from 'mongoose';

const { Schema } = mongoose;

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      default: '',
      maxlength: 2000
    },
    dueDate: {
      type: Date,
      default: null
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending'
    },
    category: {
      type: String,
      default: '',
      trim: true,
      maxlength: 80
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

taskSchema.index({ author: 1, status: 1 });
taskSchema.index({ author: 1, dueDate: 1 });
taskSchema.index({ author: 1, priority: -1, createdAt: -1 });

taskSchema.methods.toTaskJSON = function toTaskJSON() {
  return {
    id: this._id.toString(),
    title: this.title,
    description: this.description,
    dueDate: this.dueDate,
    priority: this.priority,
    status: this.status,
    category: this.category,
    completedAt: this.completedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

const Task = mongoose.model('Task', taskSchema);

export default Task;
