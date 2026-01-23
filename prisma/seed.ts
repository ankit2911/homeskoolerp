import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await prisma.studentSubject.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.resourceFile.deleteMany();
    await prisma.resource.deleteMany();
    await prisma.session.deleteMany();
    await prisma.teacherAllocation.deleteMany();
    await prisma.topic.deleteMany();
    await prisma.chapter.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.class.deleteMany();
    await prisma.subjectMaster.deleteMany();
    await prisma.board.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.studentProfile.deleteMany();
    await prisma.teacherProfile.deleteMany();
    await prisma.user.deleteMany();

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create Admin
    console.log('👤 Creating admin user...');
    await prisma.user.create({
        data: {
            email: 'admin@homeskool.com',
            password: hashedPassword,
            name: 'Admin User',
            role: 'ADMIN'
        }
    });

    // Create Boards
    console.log('📋 Creating boards...');
    const cbse = await prisma.board.create({ data: { name: 'CBSE' } });
    const icse = await prisma.board.create({ data: { name: 'ICSE' } });
    const state = await prisma.board.create({ data: { name: 'State Board' } });

    // Create Subject Masters
    console.log('📚 Creating subject masters...');
    const subjectMasters = await Promise.all([
        prisma.subjectMaster.create({ data: { name: 'Mathematics', code: 'MATH', category: 'primary' } }),
        prisma.subjectMaster.create({ data: { name: 'Science', code: 'SCI', category: 'primary' } }),
        prisma.subjectMaster.create({ data: { name: 'English', code: 'ENG', category: 'language' } }),
        prisma.subjectMaster.create({ data: { name: 'Hindi', code: 'HIN', category: 'language' } }),
        prisma.subjectMaster.create({ data: { name: 'Social Studies', code: 'SST', category: 'secondary' } }),
        prisma.subjectMaster.create({ data: { name: 'Computer Science', code: 'CS', category: 'elective' } }),
        prisma.subjectMaster.create({ data: { name: 'Physical Education', code: 'PE', category: 'cocurricular' } }),
        prisma.subjectMaster.create({ data: { name: 'Art & Craft', code: 'ART', category: 'cocurricular' } }),
    ]);

    // Create Classes
    console.log('🏫 Creating classes...');
    const classes: any[] = [];
    for (const board of [cbse, icse]) {
        for (let grade = 1; grade <= 10; grade++) {
            for (const section of ['A', 'B']) {
                const cls = await prisma.class.create({
                    data: {
                        name: `Class ${grade}`,
                        section,
                        boardId: board.id,
                        subjects: {
                            create: subjectMasters.slice(0, grade <= 5 ? 5 : 8).map(sm => ({
                                name: sm.name,
                                subjectMasterId: sm.id
                            }))
                        }
                    },
                    include: { subjects: true }
                });
                classes.push(cls);
            }
        }
    }

    // Create Teachers
    console.log('👨‍🏫 Creating teachers...');
    const teacherNames = [
        { first: 'Rahul', last: 'Sharma', spec: 'Mathematics, Science' },
        { first: 'Priya', last: 'Gupta', spec: 'English, Hindi' },
        { first: 'Amit', last: 'Verma', spec: 'Science, Computer Science' },
        { first: 'Sunita', last: 'Patel', spec: 'Social Studies, English' },
        { first: 'Vijay', last: 'Kumar', spec: 'Mathematics, Physical Education' },
        { first: 'Neha', last: 'Singh', spec: 'Hindi, Art & Craft' },
        { first: 'Rajesh', last: 'Mishra', spec: 'Science, Mathematics' },
        { first: 'Kavita', last: 'Reddy', spec: 'English, Social Studies' },
    ];

    const teachers: any[] = [];
    for (let i = 0; i < teacherNames.length; i++) {
        const t = teacherNames[i];
        const teacher = await prisma.user.create({
            data: {
                email: `${t.first.toLowerCase()}.${t.last.toLowerCase()}@homeskool.com`,
                password: hashedPassword,
                name: `${t.first} ${t.last}`,
                role: 'TEACHER',
                teacherProfile: {
                    create: {
                        firstName: t.first,
                        lastName: t.last,
                        phoneCode: '+91',
                        phoneNumber: `98765${String(i).padStart(5, '0')}`,
                        qualification: ['Bachelors', 'Masters', 'PhD'][i % 3],
                        experience: 3 + i * 2,
                        specialization: t.spec,
                        classes: 'Junior, Middle, High',
                        licenseNumber: `TL-2024-${1000 + i}`
                    }
                }
            },
            include: { teacherProfile: true }
        });
        teachers.push(teacher);
    }

    // Create Teacher Allocations
    console.log('📝 Creating teacher allocations...');
    for (let i = 0; i < Math.min(classes.length, 20); i++) {
        const cls = classes[i];
        for (let j = 0; j < Math.min(cls.subjects.length, 3); j++) {
            const teacher = teachers[j % teachers.length];
            await prisma.teacherAllocation.create({
                data: {
                    teacherId: teacher.teacherProfile.id,
                    classId: cls.id,
                    subjectId: cls.subjects[j].id
                }
            });
        }
    }

    // Create Students
    console.log('👨‍🎓 Creating students...');
    const studentNames = [
        'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan',
        'Ananya', 'Aadhya', 'Myra', 'Sara', 'Ira', 'Aanya', 'Kiara', 'Diya',
        'Ishaan', 'Kabir', 'Dhruv', 'Krishna', 'Rohan', 'Neil', 'Shiv', 'Om'
    ];

    const students: any[] = [];
    for (let i = 0; i < studentNames.length; i++) {
        const cls = classes[i % classes.length];
        const student = await prisma.user.create({
            data: {
                email: `${studentNames[i].toLowerCase()}${i}@student.homeskool.com`,
                password: hashedPassword,
                name: studentNames[i] + ' Student',
                role: 'STUDENT',
                studentProfile: {
                    create: {
                        firstName: studentNames[i],
                        lastName: 'Kumar',
                        rollNumber: `2025${String(i + 1).padStart(4, '0')}`,
                        dateOfBirth: new Date(2010 + (i % 10), i % 12, 1 + (i % 28)),
                        gender: i % 2 === 0 ? 'Male' : 'Female',
                        fatherName: `Father of ${studentNames[i]}`,
                        motherName: `Mother of ${studentNames[i]}`,
                        parentPhone: `98765${String(10000 + i)}`,
                        address: `House ${i + 1}, Street ${i % 10 + 1}, City`,
                        academicYear: '2025-26',
                        classId: cls.id,
                        status: 'ACTIVE'
                    }
                }
            },
            include: { studentProfile: true }
        });
        students.push(student);

        // Enroll student in some subjects
        if (student.studentProfile) {
            const subjectsToEnroll = cls.subjects.slice(0, 4);
            for (const subject of subjectsToEnroll) {
                await prisma.studentSubject.create({
                    data: {
                        studentId: student.studentProfile.id,
                        subjectId: subject.id
                    }
                });
            }
        }
    }

    // Create Chapters and Topics
    console.log('📖 Creating chapters and topics...');
    const cbseClass1 = classes.find(c => c.name === 'Class 1' && c.section === 'A');
    if (cbseClass1) {
        for (const subject of cbseClass1.subjects.slice(0, 3)) {
            for (let ch = 1; ch <= 5; ch++) {
                const chapter = await prisma.chapter.create({
                    data: {
                        name: `Chapter ${ch}: ${subject.name} Basics ${ch}`,
                        subjectId: subject.id,
                        topics: {
                            create: [
                                { name: `Topic ${ch}.1: Introduction`, description: `Introduction to chapter ${ch}` },
                                { name: `Topic ${ch}.2: Core Concepts`, description: `Main concepts of chapter ${ch}` },
                                { name: `Topic ${ch}.3: Practice`, description: `Practice problems for chapter ${ch}` },
                            ]
                        }
                    }
                });
            }
        }
    }

    // Create Sessions
    console.log('📅 Creating sessions...');
    const today = new Date();
    for (let i = 0; i < 10; i++) {
        const cls = classes[i % classes.length];
        const subject = cls.subjects[0];
        const sessionDate = new Date(today);
        sessionDate.setDate(today.getDate() + i);
        sessionDate.setHours(9 + (i % 6), 0, 0, 0);

        await prisma.session.create({
            data: {
                title: `${subject.name} - Session ${i + 1}`,
                description: `Regular class session for ${subject.name}`,
                startTime: sessionDate,
                endTime: new Date(sessionDate.getTime() + 60 * 60 * 1000),
                status: i < 3 ? 'COMPLETED' : 'SCHEDULED',
                classId: cls.id,
                subjectId: subject.id
            }
        });
    }

    // Create Resources
    console.log('📁 Creating resources...');
    const resourceTypes = ['PDF', 'VIDEO', 'LINK', 'IMAGE'];
    for (let i = 0; i < 15; i++) {
        const cls = classes[i % classes.length];
        const subject = cls.subjects[i % cls.subjects.length];

        await prisma.resource.create({
            data: {
                title: `${subject.name} Resource ${i + 1}`,
                description: `Study material for ${subject.name}`,
                type: resourceTypes[i % resourceTypes.length],
                classId: cls.id,
                subjectId: subject.id,
                files: {
                    create: [{
                        fileType: resourceTypes[i % resourceTypes.length],
                        url: `https://example.com/resource-${i + 1}`,
                        fileName: `resource-${i + 1}.${resourceTypes[i % resourceTypes.length].toLowerCase()}`
                    }]
                }
            }
        });
    }

    // Create Notifications
    console.log('🔔 Creating notifications...');
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (adminUser) {
        const notifications = [
            'New student enrolled in Class 5A',
            'Teacher Rahul submitted session report',
            'Resource uploaded for Mathematics',
            'Upcoming parent-teacher meeting',
            'System maintenance scheduled'
        ];
        for (const msg of notifications) {
            await prisma.notification.create({
                data: {
                    message: msg,
                    userId: adminUser.id,
                    isRead: false
                }
            });
        }
    }

    console.log('✅ Seed completed successfully!');
    console.log(`
📊 Summary:
- 1 Admin user
- ${teachers.length} Teachers
- ${students.length} Students
- ${classes.length} Classes
- ${subjectMasters.length} Subject Masters
- Teacher allocations created
- Chapters & Topics created
- Sessions scheduled
- Resources uploaded
- Notifications added

🔑 Login credentials:
   Email: admin@homeskool.com
   Password: password123
   
   Or any teacher/student email with password: password123
`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
