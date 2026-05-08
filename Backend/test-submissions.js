const mongoose = require('mongoose');
require('dotenv').config();

async function testSubmissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const ExamSubmission = require('./src/models/ExamSubmission.model').ExamSubmission;
    
    // Count all submissions
    const totalSubmissions = await ExamSubmission.countDocuments();
    console.log(`📊 Total submissions in database: ${totalSubmissions}`);
    
    // Get all submissions with details
    const allSubmissions = await ExamSubmission.find({})
      .populate('student_id', 'name email')
      .populate('exam_id', 'title')
      .lean();
    
    console.log('📋 All submissions:');
    allSubmissions.forEach((sub, index) => {
      console.log(`${index + 1}. Exam: ${sub.exam_id?.title || 'N/A'}, Student: ${sub.student_id?.name || 'N/A'}, Status: ${sub.status}, Score: ${sub.score}`);
    });
    
    // Check specific exam if needed
    if (process.argv[2]) {
      const examId = process.argv[2];
      const examSubmissions = await ExamSubmission.find({ exam_id: examId })
        .populate('student_id', 'name email')
        .populate('exam_id', 'title')
        .lean();
      
      console.log(`\n🎯 Submissions for exam ${examId}:`);
      examSubmissions.forEach((sub, index) => {
        console.log(`${index + 1}. ${sub.student_id?.name || 'N/A'} - ${sub.status} - Score: ${sub.score}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testSubmissions();
