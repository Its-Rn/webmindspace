import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from './src/config/database.js';
import { demoUsers } from './src/config/demoUsers.js';

import User from './src/models/User.js';
import Post from './src/models/Post.js';
import TimelinePost from './src/models/TimelinePost.js';
import Task from './src/models/Task.js';
import Note from './src/models/Note.js';
import Conversation from './src/models/Conversation.js';
import Message from './src/models/Message.js';
import Notification from './src/models/Notification.js';

const seed = async () => {
  try {
    await connectDatabase();

    // Clear existing data
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const col of collections) {
      await mongoose.connection.db.dropCollection(col.name);
    }
    console.log('Cleared existing collections.\n');

    // ── Users ──
    const users = [];
    for (const demoUser of demoUsers) {
      const { password, ...profile } = demoUser;
      const user = await User.create({
        ...profile,
        email: profile.email.trim().toLowerCase(),
        passwordHash: password
      });
      users.push(user);
    }
    console.log(`Created ${users.length} users.`);

    // ── Blog Posts ──
    const posts = await Post.create([
      {
        title: 'Getting Started with React 19',
        slug: 'getting-started-react-19',
        content: '<h2>What\'s New in React 19</h2><p>React 19 introduces several groundbreaking features that change how we build user interfaces. The new compiler, improved concurrent features, and simplified hooks make development more enjoyable than ever.</p><h3>Key Features</h3><ul><li><strong>React Compiler:</strong> Automatic memoization without hooks</li><li><strong>Server Components:</strong> Built-in support for server-side rendering</li><li><strong>Actions:</strong> Simplified form handling</li></ul><p>Start migrating your projects today to take advantage of these improvements.</p>',
        excerpt: 'A comprehensive guide to React 19\'s new features including the compiler, server components, and actions.',
        status: 'published',
        author: users[0]._id,
        tags: ['react', 'javascript', 'frontend'],
        categories: ['Development'],
        publishedAt: new Date(Date.now() - 7 * 86400000),
        seo: { title: 'Getting Started with React 19 - Guide', description: 'Learn about React 19 features including the new compiler and server components.' }
      },
      {
        title: 'Building a CLI Tool with Node.js',
        slug: 'building-cli-nodejs',
        content: '<p>Command-line interfaces are powerful tools for developers. In this guide, we\'ll build a CLI tool from scratch using Node.js and popular libraries like Commander and Inquirer.</p><pre><code>import { Command } from \'commander\'; const program = new Command(); program.version(\'1.0.0\').parse();</code></pre><p>Learn how to create interactive prompts, handle arguments, and publish your CLI to npm.</p>',
        excerpt: 'Step-by-step tutorial on creating a command-line interface tool with Node.js, Commander, and Inquirer.',
        status: 'published',
        author: users[1]._id,
        tags: ['nodejs', 'cli', 'javascript'],
        categories: ['Development', 'Tutorial'],
        publishedAt: new Date(Date.now() - 3 * 86400000),
        seo: { title: 'Building CLI Tools with Node.js', description: 'Create command-line interfaces with Node.js and Commander.' }
      },
      {
        title: 'Productivity Tips for Remote Workers',
        slug: 'productivity-remote-work',
        content: '<p>Working remotely comes with unique challenges. Here are the strategies that have helped me stay productive while working from home.</p><h3>1. Create a Morning Routine</h3><p>Start your day consistently. Wake up at the same time, exercise, and plan your day before diving into work.</p><h3>2. Use Time Blocking</h3><p>Block out specific times for deep work, meetings, and breaks. This helps maintain focus and prevents burnout.</p><h3>3. Set Physical Boundaries</h3><p>Having a dedicated workspace helps separate work life from personal life, even in small apartments.</p>',
        excerpt: 'Practical strategies for staying productive while working from home, including routines, time blocking, and workspace setup.',
        status: 'draft',
        author: users[1]._id,
        tags: ['productivity', 'remote-work', 'tips'],
        categories: ['Lifestyle'],
        publishedAt: null,
        seo: { title: 'Productivity Tips for Remote Workers', description: 'Stay productive working from home with these practical tips.' }
      }
    ]);
    console.log(`Created ${posts.length} blog posts.`);

    // ── Timeline Posts ──
    const timelineEntries = await TimelinePost.create([
      { content: 'Just shipped the new dashboard redesign 🚀', author: users[0]._id, isPinned: true },
      { content: 'Reading "Designing Data-Intensive Applications" — mind-blowing so far!', author: users[1]._id },
      { content: 'Published my first npm package today! 🎉', author: users[1]._id, isPinned: true },
      { content: 'Morning standup done. Sprint goals look achievable this week.', author: users[0]._id },
      { content: 'Exploring Bun as a Node.js alternative. The speed difference is incredible.', author: users[1]._id },
      { content: 'Just finished a 5K run. New personal best! 🏃', author: users[1]._id },
      { content: 'Migrating our MongoDB cluster to Atlas — performance improvements look promising.', author: users[0]._id },
      { content: 'Learning Rust in my spare time. The borrow checker is... interesting.', author: users[1]._id }
    ]);
    console.log(`Created ${timelineEntries.length} timeline posts.`);

    // ── Tasks ──
    const tasks = await Task.create([
      { title: 'Complete project proposal', description: 'Draft and review the Q3 project proposal before the Friday deadline.', status: 'in-progress', priority: 'high', author: users[0]._id, dueDate: new Date(Date.now() + 2 * 86400000) },
      { title: 'Review pull requests', description: 'Review open PRs from the team — 5 pending.', status: 'pending', priority: 'medium', author: users[0]._id, dueDate: new Date(Date.now() + 1 * 86400000) },
      { title: 'Update dependencies', description: 'Run npm audit and update vulnerable packages across all projects.', status: 'completed', priority: 'medium', author: users[0]._id, completedAt: new Date(Date.now() - 1 * 86400000) },
      { title: 'Write API documentation', description: 'Document the new chat endpoints for the developer portal.', status: 'pending', priority: 'low', author: users[1]._id, dueDate: new Date(Date.now() + 5 * 86400000) },
      { title: 'Fix login page CSS', description: 'The login form is misaligned on mobile devices.', status: 'completed', priority: 'high', author: users[1]._id, completedAt: new Date(Date.now() - 2 * 86400000) },
      { title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for automated testing and deployment.', status: 'in-progress', priority: 'high', author: users[1]._id },
      { title: 'Write blog post: Top 10 Productivity Tools', description: 'Research and draft a listicle about productivity tools for developers.', status: 'pending', priority: 'medium', author: users[1]._id, dueDate: new Date(Date.now() + 7 * 86400000) },
      { title: 'Record video tutorial', description: 'Record and edit the "Getting Started" video series — Part 1.', status: 'pending', priority: 'low', author: users[1]._id }
    ]);
    console.log(`Created ${tasks.length} tasks.`);

    // ── Notes ──
    const notes = await Note.create([
      { title: 'Meeting Notes — Sprint Planning', content: 'Sprint goals:\n- Complete user authentication module\n- Fix dashboard performance issues\n- Start chat feature implementation\n\nAction items:\n- Kunal: auth module review\n- Aryan: performance audit and chat wireframes', tags: ['meetings', 'sprint'], author: users[0]._id, isPinned: true },
      { title: 'API Design Principles', content: '1. Consistency in naming conventions\n2. Proper HTTP status codes\n3. Versioning from day one\n4. Comprehensive error messages\n5. Rate limiting for all endpoints', tags: ['api', 'backend'], author: users[1]._id, color: '#3b82f6' },
      { title: 'Book Ideas', content: '- "The Pragmatic Programmer" — re-read\n- "Clean Code" — finishing chapter 7\n- "System Design Interview" — next on list', tags: ['books', 'reading'], author: users[1]._id },
      { title: 'Project Ideas', content: '1. Open-source CLI tool for project scaffolding\n2. VS Code extension for code snippets\n3. Personal finance dashboard\n4. Habit tracker with social features', tags: ['ideas', 'projects'], author: users[0]._id },
      { title: 'Grocery List', content: '- Eggs\n- Milk\n- Bread\n- Avocados\n- Coffee beans\n- Olive oil', tags: ['personal'], author: users[1]._id, color: '#10b981' }
    ]);
    console.log(`Created ${notes.length} notes.`);

    // ── Chat: Conversation + Messages ──
    const conversation = await Conversation.create({
      participants: [users[0]._id, users[1]._id],
      lastMessage: { content: 'Sounds good! Let me know when it\'s ready.', sender: users[0]._id, sentAt: new Date() }
    });
    const messages = await Message.create([
      { conversation: conversation._id, sender: users[1]._id, content: 'Hey Kunal! Have you seen the new dashboard metrics?' },
      { conversation: conversation._id, sender: users[0]._id, content: 'Yes! The user engagement charts are looking great. Up 23% this week.' },
      { conversation: conversation._id, sender: users[1]._id, content: 'Nice! I think we should add weekly email summaries too.' },
      { conversation: conversation._id, sender: users[0]._id, content: 'Good idea. Let me create a task for it and we can discuss in standup.' },
      { conversation: conversation._id, sender: users[1]._id, content: 'Sounds good! Let me know when it\'s ready.', readBy: [users[0]._id] }
    ]);
    console.log(`Created 1 conversation with ${messages.length} messages.`);

    // ── Notifications ──
    const notifications = await Notification.create([
      { recipient: users[0]._id, type: 'system', title: 'Welcome to the platform!', message: 'Your account has been created. Start exploring the features.', link: '/dashboard' },
      { recipient: users[1]._id, type: 'system', title: 'Welcome to the platform!', message: 'Your account has been created. Start exploring the features.', link: '/dashboard' },
      { recipient: users[0]._id, type: 'chat', title: 'New message from Aryan', message: 'Sounds good! Let me know when it\'s ready.', link: '/chat' },
      { recipient: users[0]._id, type: 'task_reminder', title: 'Task due tomorrow', message: '"Review pull requests" is due tomorrow.', link: '/tasks' }
    ]);
    console.log(`Created ${notifications.length} notifications.`);

    console.log(`\n✓ Seed complete!`);
    for (const { email, password, role } of demoUsers) {
      console.log(`   ${role}: ${email.trim().toLowerCase()} / ${password}`);
    }

    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    await disconnectDatabase();
    process.exit(1);
  }
};

seed();
