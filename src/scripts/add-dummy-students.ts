import { db } from '../lib/db';
import bcrypt from 'bcryptjs';

const dummyStudents = [
  {
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice.johnson@school.com',
    rollNumber: '2025001',
    classId: 'class1', // Need to get actual class ids
    fatherName: 'Robert Johnson',
    motherName: 'Sarah Johnson',
    parentPhone: '+91 9876543210',
    studentEmail: 'alice@gmail.com',
    address: '123 Main St, City, State',
    previousSchool: 'ABC Public School',
    status: 'ACTIVE',
    adminComments: 'Excellent student'
  },
  // Add more...
];

async function addDummyStudents() {
  for (const student of dummyStudents) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await db.user.create({
      data: {
        name: `${student.firstName} ${student.lastName}`.trim(),
        email: student.email,
        password: hashedPassword,
        role: 'STUDENT',
        studentProfile: {
          create: {
            firstName: student.firstName,
            lastName: student.lastName,
            rollNumber: student.rollNumber,
            fatherName: student.fatherName,
            motherName: student.motherName,
            parentPhone: student.parentPhone,
            studentEmail: student.studentEmail,
            address: student.address,
            previousSchool: student.previousSchool,
            classId: student.classId,
            status: student.status,
            adminComments: student.adminComments
          }
        }
      }
    });
  }
  console.log('Dummy students added');
}

addDummyStudents().catch(console.error);