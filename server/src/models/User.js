import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      maxlength: 40,
      default: ''
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    avatarUrl: {
      type: String,
      default: ''
    },
    avatarStorageProvider: {
      type: String,
      enum: ['local', 'cloudinary'],
      default: 'local'
    },
    avatarStorageKey: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: '',
      maxlength: 250
    },
    title: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120
    },
    location: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120
    },
    website: {
      type: String,
      default: '',
      trim: true,
      maxlength: 200
    },
    timezone: {
      type: String,
      default: '',
      trim: true,
      maxlength: 80
    },
    skills: {
      type: [String],
      default: []
    },
    socialLinks: {
      website: {
        type: String,
        default: ''
      },
      github: {
        type: String,
        default: ''
      },
      linkedin: {
        type: String,
        default: ''
      },
      x: {
        type: String,
        default: ''
      }
    },
    dailyStreak: {
      type: Number,
      default: 0
    },
    bestStreak: {
      type: Number,
      default: 0
    },
    streakUpdatedAt: {
      type: Date,
      default: null
    },
    lastActiveAt: {
      type: Date,
      default: null
    },
    stats: {
      tasksCreated: {
        type: Number,
        default: 0
      },
      tasksCompleted: {
        type: Number,
        default: 0
      },
      blogsPublished: {
        type: Number,
        default: 0
      },
      notesCreated: {
        type: Number,
        default: 0
      },
      timelinePosts: {
        type: Number,
        default: 0
      },
      messagesSent: {
        type: Number,
        default: 0
      }
    },
    role: {
      type: String,
      enum: ['guest', 'user', 'writer', 'moderator', 'admin'],
      default: 'user'
    },
    chatEnabled: {
      type: Boolean,
      default: true
    },
    chatSuspendedAt: {
      type: Date,
      default: null
    },
    chatSuspensionReason: {
      type: String,
      default: '',
      trim: true,
      maxlength: 250
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    emailVerifiedAt: {
      type: Date,
      default: null
    },
    emailVerificationTokenHash: {
      type: String,
      default: null,
      select: false
    },
    emailVerificationExpiresAt: {
      type: Date,
      default: null,
      select: false
    },
    passwordResetTokenHash: {
      type: String,
      default: null,
      select: false
    },
    passwordResetExpiresAt: {
      type: Date,
      default: null,
      select: false
    },
    lastLoginAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

userSchema.pre('save', async function passwordHasher() {
  const { passwordHash } = this;
  if (!passwordHash) return;

  // Already a bcrypt hash — never double-hash.
  if (/^\$2[aby]\$\d{2}\$.+$/.test(passwordHash)) return;

  this.passwordHash = await bcrypt.hash(passwordHash, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.toAuthJSON = function toAuthJSON() {
  return {
    ...this.toProfileJSON(),
    email: this.email,
    username: this.username,
    role: this.role,
    isActive: this.isActive,
    isEmailVerified: this.isEmailVerified,
    chatEnabled: this.chatEnabled,
    emailVerifiedAt: this.emailVerifiedAt,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

userSchema.methods.toProfileJSON = function toProfileJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    username: this.username || this.email?.split('@')[0] || '',
    avatarUrl: this.avatarUrl,
    title: this.title,
    location: this.location,
    website: this.website,
    bio: this.bio,
    timezone: this.timezone,
    skills: this.skills,
    socialLinks: this.socialLinks,
    role: this.role,
    isActive: this.isActive,
    isEmailVerified: this.isEmailVerified,
    chatEnabled: this.chatEnabled,
    chatSuspendedAt: this.chatSuspendedAt,
    chatSuspensionReason: this.chatSuspensionReason,
    dailyStreak: this.dailyStreak,
    bestStreak: this.bestStreak,
    streakUpdatedAt: this.streakUpdatedAt,
    lastActiveAt: this.lastActiveAt,
    stats: this.stats,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

const User = mongoose.model('User', userSchema);

export default User;
