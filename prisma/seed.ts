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
