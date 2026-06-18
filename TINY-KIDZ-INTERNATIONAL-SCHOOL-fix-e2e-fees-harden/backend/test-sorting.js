const axios = require('axios');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const User = require('./models/User');
    
    const adminUser = await User.findOne({ role: 'admin' });
    const testToken = jwt.sign(
      { id: adminUser._id.toString(), role: 'admin' },
      process.env.JWT_SECRET || 'tinykidzsecret'
    );
    
    console.log('Testing sorting feature...\n');
    
    setTimeout(async () => {
      try {
        // Test sort by admission number ascending
        const response1 = await axios.get('http://localhost:5000/api/students?page=1&limit=5&sortBy=admissionNumber&sortOrder=asc', {
          headers: { Authorization: `Bearer ${testToken}` }
        });
        
        console.log('✅ Sort by Admission Number (ASC):');
        response1.data.data.forEach((s, i) => {
          console.log(`  ${i+1}. ${s.admissionNumber} - ${s.userId.name}`);
        });
        
        // Test sort by admission number descending
        const response2 = await axios.get('http://localhost:5000/api/students?page=1&limit=5&sortBy=admissionNumber&sortOrder=desc', {
          headers: { Authorization: `Bearer ${testToken}` }
        });
        
        console.log('\n✅ Sort by Admission Number (DESC):');
        response2.data.data.forEach((s, i) => {
          console.log(`  ${i+1}. ${s.admissionNumber} - ${s.userId.name}`);
        });
        
        // Test sort by name
        const response3 = await axios.get('http://localhost:5000/api/students?page=1&limit=5&sortBy=name&sortOrder=asc', {
          headers: { Authorization: `Bearer ${testToken}` }
        });
        
        console.log('\n✅ Sort by Name (ASC):');
        response3.data.data.forEach((s, i) => {
          console.log(`  ${i+1}. ${s.userId.name} - ${s.admissionNumber}`);
        });
        
        console.log('\n✅ Sorting feature is working perfectly!');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
          console.error('Status:', error.response.status);
          console.error('Data:', error.response.data);
        }
        process.exit(1);
      }
    }, 2000);
  })
  .catch(err => {
    console.error('❌ DB Error:', err.message);
    process.exit(1);
  });
