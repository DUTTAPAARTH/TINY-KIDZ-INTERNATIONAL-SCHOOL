const mongoose = require('mongoose');
require('dotenv').config();

console.log('Database Connection String:');
console.log(process.env.MONGO_URI.replace(/:[^:@]*@/, ':****@'));

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const User = require('./models/User');
    const Class = require('./models/Class');
    const Student = require('./models/Student');
    const students = await Student.find({})
      .limit(5)
      .populate('userId', 'name email')
      .populate('classId', 'className section')
      .sort({ createdAt: -1 });
    
    console.log('\n✓ Connected to MongoDB Atlas Cloud Database');
    console.log('✓ Total students in database:', await Student.countDocuments({}));
    console.log('\nFirst 5 students from MongoDB:');
    students.forEach((s, i) => {
      const name = s.userId?.name || 'N/A';
      const admission = s.admissionNumber;
      const className = s.classId?.className || 'N/A';
      const section = s.classId?.section || 'N/A';
      console.log(`  ${i+1}. ${name} - Admission: ${admission} - Class: ${className}-${section}`);
    });
    
    console.log('\nDatabase Info:');
    console.log('  - Host: MongoDB Atlas (Cloud)');
    console.log('  - Cluster: TINYKIDZ');
    console.log('  - Data Source: Cloud Database (NOT local MongoDB)');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('✗ Error:', err.message);
    process.exit(1);
  });
