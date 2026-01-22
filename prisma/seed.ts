import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const password = await bcrypt.hash('password123', 10)

    const admin = await prisma.user.upsert({
        where: { email: 'admin@school.com' },
        update: {},
        create: {
            email: 'admin@school.com',
            name: 'Admin User',
            password,
            role: 'ADMIN',
        },
    })

    // Create boards
    const cbse = await prisma.board.upsert({
        where: { name: 'CBSE' },
        update: {},
        create: { name: 'CBSE' }
    })

    const icse = await prisma.board.upsert({
        where: { name: 'ICSE' },
        update: {},
        create: { name: 'ICSE' }
    })

    // Create classes
    const classes = [
        { name: 'Class 1', boardId: cbse.id },
        { name: 'Class 2', boardId: cbse.id },
        { name: 'Class 3', boardId: cbse.id },
        { name: 'Class 4', boardId: cbse.id },
        { name: 'Class 5', boardId: cbse.id },
        { name: 'Class 6', boardId: cbse.id },
        { name: 'Class 7', boardId: cbse.id },
        { name: 'Class 8', boardId: cbse.id },
        { name: 'Class 9', boardId: cbse.id },
        { name: 'Class 10', boardId: cbse.id },
        { name: 'Class 11', boardId: icse.id },
        { name: 'Class 12', boardId: icse.id }
    ]

    const createdClasses = []
    for (const cls of classes) {
        const created = await prisma.class.create({
            data: cls
        })
        createdClasses.push(created)
    }

    const teachers = [
        {
            email: 'sarah.johnson@homeskool.com',
            name: 'Sarah Johnson',
            firstName: 'Sarah',
            lastName: 'Johnson',
            phoneCode: '+1',
            phoneNumber: '5550123',
            qualification: 'Masters',
            experience: 8,
            specialization: 'Mathematics, Calculus',
            classes: 'High, Middle',
            licenseNumber: 'TL-USA-9982'
        },
        {
            email: 'david.smith@homeskool.com',
            name: 'David Smith',
            firstName: 'David',
            lastName: 'Smith',
            phoneCode: '+44',
            phoneNumber: '7700900123',
            qualification: 'Bachelors',
            experience: 4,
            specialization: 'Physics, Chemistry',
            classes: 'Middle, High',
            licenseNumber: 'TL-UK-4412'
        },
        {
            email: 'priya.sharma@homeskool.com',
            name: 'Priya Sharma',
            firstName: 'Priya',
            lastName: 'Sharma',
            phoneCode: '+91',
            phoneNumber: '9876543210',
            qualification: 'PhD',
            experience: 12,
            specialization: 'Biology, Environmental Science',
            classes: 'High',
            licenseNumber: 'TL-IN-1029'
        },
        {
            email: 'ahmed.ali@homeskool.com',
            name: 'Ahmed Ali',
            firstName: 'Ahmed',
            lastName: 'Ali',
            phoneCode: '+971',
            phoneNumber: '501234567',
            qualification: 'Masters',
            experience: 6,
            specialization: 'English Literature, History',
            classes: 'Junior, Middle',
            licenseNumber: 'TL-UAE-5561'
        },
        {
            email: 'emily.brown@homeskool.com',
            name: 'Emily Brown',
            firstName: 'Emily',
            lastName: 'Brown',
            phoneCode: '+1',
            phoneNumber: '5550987',
            qualification: 'Diploma',
            experience: 2,
            specialization: 'Early Childhood Education, Arts',
            classes: 'Kids',
            licenseNumber: 'TL-USA-1102'
        }
    ];

    for (const t of teachers) {
        await prisma.user.upsert({
            where: { email: t.email },
            update: {},
            create: {
                email: t.email,
                name: t.name,
                password,
                role: 'TEACHER',
                teacherProfile: {
                    create: {
                        firstName: t.firstName,
                        lastName: t.lastName,
                        phoneCode: t.phoneCode,
                        phoneNumber: t.phoneNumber,
                        qualification: t.qualification,
                        experience: t.experience,
                        specialization: t.specialization,
                        classes: t.classes,
                        licenseNumber: t.licenseNumber
                    }
                }
            }
        });
    }

    const student = await prisma.user.upsert({
        where: { email: 'student@school.com' },
        update: {},
        create: {
            email: 'student@school.com',
            name: 'Student User',
            password,
            role: 'STUDENT',
            studentProfile: {
                create: {}
            }
        },
    })

    // Add dummy students
    const dummyStudents = [
        { firstName: 'Alice', lastName: 'Johnson', email: 'alice.johnson@school.com', classId: createdClasses[0].id, rollNumber: '2025001', fatherName: 'Robert Johnson', motherName: 'Sarah Johnson', parentPhone: '+91 9876543210', studentEmail: 'alice@gmail.com', address: '123 Main St, City, State', previousSchool: 'ABC Public School', status: 'ACTIVE' },
        { firstName: 'Bob', lastName: 'Smith', email: 'bob.smith@school.com', classId: createdClasses[1].id, rollNumber: '2025002', fatherName: 'John Smith', motherName: 'Jane Smith', parentPhone: '+91 9876543211', studentEmail: 'bob@gmail.com', address: '456 Elm St, City, State', previousSchool: 'XYZ High School', status: 'ACTIVE' },
        { firstName: 'Charlie', lastName: 'Brown', email: 'charlie.brown@school.com', classId: createdClasses[2].id, rollNumber: '2025003', fatherName: 'David Brown', motherName: 'Lisa Brown', parentPhone: '+91 9876543212', studentEmail: 'charlie@gmail.com', address: '789 Oak St, City, State', previousSchool: 'DEF School', status: 'ACTIVE' },
        { firstName: 'Diana', lastName: 'Prince', email: 'diana.prince@school.com', classId: createdClasses[3].id, rollNumber: '2025004', fatherName: 'Steve Prince', motherName: 'Wonder Prince', parentPhone: '+91 9876543213', studentEmail: 'diana@gmail.com', address: '101 Pine St, City, State', previousSchool: 'GHI Academy', status: 'ACTIVE' },
        { firstName: 'Eve', lastName: 'Adams', email: 'eve.adams@school.com', classId: createdClasses[4].id, rollNumber: '2025005', fatherName: 'Adam Adams', motherName: 'Eve Adams', parentPhone: '+91 9876543214', studentEmail: 'eve@gmail.com', address: '202 Maple St, City, State', previousSchool: 'JKL School', status: 'ACTIVE' },
        { firstName: 'Frank', lastName: 'Miller', email: 'frank.miller@school.com', classId: createdClasses[5].id, rollNumber: '2025006', fatherName: 'George Miller', motherName: 'Helen Miller', parentPhone: '+91 9876543215', studentEmail: 'frank@gmail.com', address: '303 Birch St, City, State', previousSchool: 'MNO High', status: 'ACTIVE' },
        { firstName: 'Grace', lastName: 'Lee', email: 'grace.lee@school.com', classId: createdClasses[6].id, rollNumber: '2025007', fatherName: 'Henry Lee', motherName: 'Ivy Lee', parentPhone: '+91 9876543216', studentEmail: 'grace@gmail.com', address: '404 Cedar St, City, State', previousSchool: 'PQR Academy', status: 'ACTIVE' },
        { firstName: 'Henry', lastName: 'Wilson', email: 'henry.wilson@school.com', classId: createdClasses[7].id, rollNumber: '2025008', fatherName: 'Jack Wilson', motherName: 'Karen Wilson', parentPhone: '+91 9876543217', studentEmail: 'henry@gmail.com', address: '505 Spruce St, City, State', previousSchool: 'STU School', status: 'ACTIVE' },
        { firstName: 'Ivy', lastName: 'Moore', email: 'ivy.moore@school.com', classId: createdClasses[8].id, rollNumber: '2025009', fatherName: 'Larry Moore', motherName: 'Mary Moore', parentPhone: '+91 9876543218', studentEmail: 'ivy@gmail.com', address: '606 Fir St, City, State', previousSchool: 'VWX High', status: 'ACTIVE' },
        { firstName: 'Jack', lastName: 'Taylor', email: 'jack.taylor@school.com', classId: createdClasses[9].id, rollNumber: '2025010', fatherName: 'Nathan Taylor', motherName: 'Olivia Taylor', parentPhone: '+91 9876543219', studentEmail: 'jack@gmail.com', address: '707 Ash St, City, State', previousSchool: 'YZ Academy', status: 'ACTIVE' },
        { firstName: 'Karen', lastName: 'Anderson', email: 'karen.anderson@school.com', classId: createdClasses[10].id, rollNumber: '2025011', fatherName: 'Paul Anderson', motherName: 'Quinn Anderson', parentPhone: '+91 9876543220', studentEmail: 'karen@gmail.com', address: '808 Willow St, City, State', previousSchool: 'BCD School', status: 'ACTIVE' },
        { firstName: 'Larry', lastName: 'Thomas', email: 'larry.thomas@school.com', classId: createdClasses[11].id, rollNumber: '2025012', fatherName: 'Ryan Thomas', motherName: 'Sara Thomas', parentPhone: '+91 9876543221', studentEmail: 'larry@gmail.com', address: '909 Poplar St, City, State', previousSchool: 'EFG High', status: 'ACTIVE' },
        { firstName: 'Mary', lastName: 'Jackson', email: 'mary.jackson@school.com', classId: createdClasses[0].id, rollNumber: '2025013', fatherName: 'Tom Jackson', motherName: 'Uma Jackson', parentPhone: '+91 9876543222', studentEmail: 'mary@gmail.com', address: '1010 Chestnut St, City, State', previousSchool: 'HIJ Academy', status: 'INACTIVE', adminComments: 'Temporarily inactive' },
        { firstName: 'Nathan', lastName: 'White', email: 'nathan.white@school.com', classId: createdClasses[1].id, rollNumber: '2025014', fatherName: 'Victor White', motherName: 'Wendy White', parentPhone: '+91 9876543223', studentEmail: 'nathan@gmail.com', address: '1111 Hickory St, City, State', previousSchool: 'KLM School', status: 'SUSPENDED', adminComments: 'Suspended for misconduct' },
        { firstName: 'Olivia', lastName: 'Harris', email: 'olivia.harris@school.com', classId: createdClasses[2].id, rollNumber: '2025015', fatherName: 'Xavier Harris', motherName: 'Yara Harris', parentPhone: '+91 9876543224', studentEmail: 'olivia@gmail.com', address: '1212 Sycamore St, City, State', previousSchool: 'NOP High', status: 'ACTIVE' },
        { firstName: 'Paul', lastName: 'Martin', email: 'paul.martin@school.com', classId: createdClasses[3].id, rollNumber: '2025016', fatherName: 'Zane Martin', motherName: 'Amy Martin', parentPhone: '+91 9876543225', studentEmail: 'paul@gmail.com', address: '1313 Alder St, City, State', previousSchool: 'QRS Academy', status: 'ACTIVE' },
        { firstName: 'Quinn', lastName: 'Thompson', email: 'quinn.thompson@school.com', classId: createdClasses[4].id, rollNumber: '2025017', fatherName: 'Ben Thompson', motherName: 'Cathy Thompson', parentPhone: '+91 9876543226', studentEmail: 'quinn@gmail.com', address: '1414 Beech St, City, State', previousSchool: 'TUV School', status: 'ACTIVE' },
        { firstName: 'Ryan', lastName: 'Garcia', email: 'ryan.garcia@school.com', classId: createdClasses[5].id, rollNumber: '2025018', fatherName: 'David Garcia', motherName: 'Eva Garcia', parentPhone: '+91 9876543227', studentEmail: 'ryan@gmail.com', address: '1515 Dogwood St, City, State', previousSchool: 'WXY High', status: 'ACTIVE' },
        { firstName: 'Sara', lastName: 'Martinez', email: 'sara.martinez@school.com', classId: createdClasses[6].id, rollNumber: '2025019', fatherName: 'Frank Martinez', motherName: 'Gina Martinez', parentPhone: '+91 9876543228', studentEmail: 'sara@gmail.com', address: '1616 Elm St, City, State', previousSchool: 'ZAB Academy', status: 'ACTIVE' },
        { firstName: 'Tom', lastName: 'Robinson', email: 'tom.robinson@school.com', classId: createdClasses[7].id, rollNumber: '2025020', fatherName: 'Harry Robinson', motherName: 'Iris Robinson', parentPhone: '+91 9876543229', studentEmail: 'tom@gmail.com', address: '1717 Pine St, City, State', previousSchool: 'CDE School', status: 'ACTIVE' }
    ]

    for (const s of dummyStudents) {
        await prisma.user.upsert({
            where: { email: s.email },
            update: {},
            create: {
                email: s.email,
                name: `${s.firstName} ${s.lastName}`.trim(),
                password,
                role: 'STUDENT',
                studentProfile: {
                    create: {
                        firstName: s.firstName,
                        lastName: s.lastName,
                        rollNumber: s.rollNumber,
                        fatherName: s.fatherName,
                        motherName: s.motherName,
                        parentPhone: s.parentPhone,
                        studentEmail: s.studentEmail,
                        address: s.address,
                        previousSchool: s.previousSchool,
                        classId: s.classId,
                        status: s.status,
                        adminComments: s.adminComments || ''
                    }
                }
            }
        })
    }

    console.log({ admin, student })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
