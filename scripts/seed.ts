import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Course } from '../models/Course';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  console.error('Define MONGODB_URI en tu .env.local');
  process.exit(1);
}

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado a MongoDB');

  await User.deleteMany({});
  await Course.deleteMany({});

  const passwordHash = await bcrypt.hash('Test1234', 12);

  await User.create({
    firstName: 'Admin',
    lastName: 'Sistema',
    email: 'admin@lms.com',
    password: passwordHash,
    role: 'admin',
    termsAccepted: true,
    emailVerified: true,
  });

  const tutors = await User.create([
    {
      firstName: 'María',
      lastName: 'González',
      email: 'maria@lms.com',
      password: passwordHash,
      role: 'tutor',
      bio: 'Profesora de inglés certificada con 8 años de experiencia. Especialista en conversación y preparación TOEFL.',
      hourlyRate: 25,
      termsAccepted: true,
      emailVerified: true,
    },
    {
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      email: 'carlos@lms.com',
      password: passwordHash,
      role: 'tutor',
      bio: 'Tutor de español nativo con maestría en lingüística. Enseño español de negocios y cultura latinoamericana.',
      hourlyRate: 20,
      termsAccepted: true,
      emailVerified: true,
    },
    {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah@lms.com',
      password: passwordHash,
      role: 'tutor',
      bio: 'Native English speaker from New York. I specialize in beginner English and pronunciation.',
      hourlyRate: 22,
      termsAccepted: true,
      emailVerified: true,
    },
    {
      firstName: 'Ana',
      lastName: 'Martínez',
      email: 'ana@lms.com',
      password: passwordHash,
      role: 'tutor',
      bio: 'Profesora de español e inglés. Bilingüe con experiencia enseñando a estudiantes de todos los niveles.',
      hourlyRate: 18,
      termsAccepted: true,
      emailVerified: true,
    },
  ]);

  await User.create({
    firstName: 'Estudiante',
    lastName: 'Prueba',
    email: 'student@lms.com',
    password: passwordHash,
    role: 'student',
    termsAccepted: true,
    emailVerified: true,
  });

  console.log(`Creados: ${tutors.length} tutores, 1 admin, 1 estudiante`);

  const courses = await Course.create([
    {
      title: 'Inglés para Principiantes: De Cero a Conversar',
      slug: 'ingles-principiantes-cero-conversar',
      description: `Aprende inglés desde cero con este curso completo diseñado para hispanohablantes.

En este curso cubriremos:
- Vocabulario básico de la vida diaria
- Gramática fundamental (presente, pasado, futuro)
- Pronunciación y entonación
- Conversaciones prácticas para viajar, trabajar y socializar
- Ejercicios de escucha y comprensión

Al finalizar, podrás mantener conversaciones básicas en inglés con confianza.`,
      shortDescription: 'Curso completo de inglés para hispanohablantes sin experiencia previa.',
      tutor: tutors[0]._id,
      thumbnailUrl: '',
      price: 45000,
      language: 'english',
      level: 'beginner',
      isPublished: true,
      isActive: true,
      category: 'conversacion',
      tags: ['inglés', 'principiante', 'conversación'],
      enrolledCount: 34,
      rating: 4.8,
      reviewCount: 12,
      totalDuration: 1800,
      totalLessons: 24,
      modules: [
        {
          title: 'Saludos y Presentaciones',
          description: 'Aprende a presentarte y saludar en inglés',
          order: 1,
          lessons: [
            { title: 'Hello! Saludos básicos', type: 'video', duration: 15, order: 1 },
            { title: 'My name is... Presentándose', type: 'video', duration: 12, order: 2 },
            { title: 'Vocabulario: Saludos', type: 'pdf', order: 3 },
            { title: 'Quiz: Saludos', type: 'quiz', order: 4 },
          ],
        },
        {
          title: 'La Familia y la Casa',
          description: 'Vocabulario familiar y del hogar',
          order: 2,
          lessons: [
            { title: 'Mi familia - Vocabulario', type: 'video', duration: 18, order: 1 },
            { title: 'This is my house', type: 'video', duration: 14, order: 2 },
            { title: 'Ejercicio: Describe tu familia', type: 'assignment', order: 3 },
          ],
        },
        {
          title: 'Comida y Restaurante',
          description: 'Cómo ordenar comida y hablar sobre gastronomía',
          order: 3,
          lessons: [
            { title: 'En el restaurante', type: 'video', duration: 20, order: 1 },
            { title: 'Vocabulario: Comida y bebidas', type: 'pdf', order: 2 },
            { title: 'I would like... Ordenando', type: 'video', duration: 16, order: 3 },
            { title: 'Quiz: En el restaurante', type: 'quiz', order: 4 },
          ],
        },
      ],
    },
    {
      title: 'Inglés Intermedio: Fluidez y Confianza',
      slug: 'ingles-intermedio-fluidez-confianza',
      description: `Lleva tu inglés al siguiente nivel. Este curso está diseñado para estudiantes que ya tienen una base y quieren ganar fluidez.

Temas principales:
- Tiempos verbales avanzados (Present Perfect, Past Continuous)
- Phrasal verbs esenciales
- Conversaciones de negocios
- Expresiones idiomáticas comunes
- Técnicas de presentación en inglés

Desarrolla confianza para participar en reuniones, entrevistas y situaciones sociales en inglés.`,
      shortDescription: 'Perfecciona tu inglés intermedio con conversaciones reales y gramática avanzada.',
      tutor: tutors[0]._id,
      thumbnailUrl: '',
      price: 65000,
      language: 'english',
      level: 'intermediate',
      isPublished: true,
      isActive: true,
      category: 'conversacion',
      tags: ['inglés', 'intermedio', 'negocios'],
      enrolledCount: 22,
      rating: 4.6,
      reviewCount: 8,
      totalDuration: 2400,
      totalLessons: 32,
      modules: [
        {
          title: 'Tiempos Verbales Avanzados',
          order: 1,
          lessons: [
            { title: 'Present Perfect - ¿Cuándo usarlo?', type: 'video', duration: 22, order: 1 },
            { title: 'Past Continuous vs Simple Past', type: 'video', duration: 18, order: 2 },
            { title: 'Ejercicios de práctica', type: 'assignment', order: 3 },
          ],
        },
        {
          title: 'Phrasal Verbs del Día a Día',
          order: 2,
          lessons: [
            { title: 'Phrasal verbs con "Get"', type: 'video', duration: 16, order: 1 },
            { title: 'Phrasal verbs con "Take"', type: 'video', duration: 14, order: 2 },
            { title: 'Lista de phrasal verbs esenciales', type: 'pdf', order: 3 },
            { title: 'Quiz: Phrasal Verbs', type: 'quiz', order: 4 },
          ],
        },
      ],
    },
    {
      title: 'Inglés Avanzado: Dominio Profesional',
      slug: 'ingles-avanzado-dominio-profesional',
      description: `Curso avanzado para profesionales que necesitan dominar el inglés en entornos corporativos.

Incluye:
- Presentaciones ejecutivas en inglés
- Negociaciones y reuniones
- Escritura de emails profesionales
- Inglés legal y financiero
- Preparación para certificaciones (TOEFL, IELTS)`,
      shortDescription: 'Domina el inglés profesional para reuniones, presentaciones y negociaciones.',
      tutor: tutors[2]._id,
      thumbnailUrl: '',
      price: 85000,
      language: 'english',
      level: 'advanced',
      isPublished: true,
      isActive: true,
      category: 'negocios',
      tags: ['inglés', 'avanzado', 'negocios', 'TOEFL'],
      enrolledCount: 15,
      rating: 4.9,
      reviewCount: 6,
      totalDuration: 3000,
      totalLessons: 28,
      modules: [
        {
          title: 'Presentaciones Ejecutivas',
          order: 1,
          lessons: [
            { title: 'Estructura de una presentación profesional', type: 'video', duration: 25, order: 1 },
            { title: 'Vocabulario corporativo esencial', type: 'pdf', order: 2 },
            { title: 'Práctica: Tu primera presentación', type: 'assignment', order: 3 },
          ],
        },
      ],
    },
    {
      title: 'Español para Extranjeros: Nivel Inicial',
      slug: 'espanol-extranjeros-nivel-inicial',
      description: `Learn Spanish from scratch! This course is designed for English speakers who want to learn Spanish.

You will learn:
- Basic Spanish vocabulary and phrases
- Essential grammar (present tense, ser vs estar)
- Pronunciation and accent
- Practical conversations for travel and daily life
- Cultural insights about Latin America`,
      shortDescription: 'Aprende español desde cero con clases prácticas y dinámicas.',
      tutor: tutors[1]._id,
      thumbnailUrl: '',
      price: 40000,
      language: 'spanish',
      level: 'beginner',
      isPublished: true,
      isActive: true,
      category: 'conversacion',
      tags: ['español', 'principiante', 'extranjeros'],
      enrolledCount: 28,
      rating: 4.7,
      reviewCount: 10,
      totalDuration: 1500,
      totalLessons: 20,
      modules: [
        {
          title: 'Primeros Pasos en Español',
          order: 1,
          lessons: [
            { title: '¡Hola! Basic greetings', type: 'video', duration: 14, order: 1 },
            { title: 'El alfabeto español', type: 'video', duration: 10, order: 2 },
            { title: 'Numbers 1-100', type: 'video', duration: 12, order: 3 },
            { title: 'Quiz: Lo básico', type: 'quiz', order: 4 },
          ],
        },
        {
          title: 'Ser vs Estar',
          order: 2,
          lessons: [
            { title: 'When to use "Ser"', type: 'video', duration: 18, order: 1 },
            { title: 'When to use "Estar"', type: 'video', duration: 16, order: 2 },
            { title: 'Practice exercises', type: 'assignment', order: 3 },
          ],
        },
      ],
    },
    {
      title: 'Español Intermedio: Conversación y Cultura',
      slug: 'espanol-intermedio-conversacion-cultura',
      description: `Mejora tu español con conversaciones auténticas y sumérgete en la cultura latinoamericana.

Contenido:
- Subjuntivo y sus usos
- Expresiones coloquiales
- Cultura y tradiciones de Latinoamérica
- Conversaciones sobre actualidad
- Español de negocios`,
      shortDescription: 'Mejora tu fluidez en español con conversaciones reales y contenido cultural.',
      tutor: tutors[3]._id,
      thumbnailUrl: '',
      price: 55000,
      language: 'spanish',
      level: 'intermediate',
      isPublished: true,
      isActive: true,
      category: 'conversacion',
      tags: ['español', 'intermedio', 'cultura'],
      enrolledCount: 19,
      rating: 4.5,
      reviewCount: 7,
      totalDuration: 2100,
      totalLessons: 26,
      modules: [
        {
          title: 'El Subjuntivo',
          order: 1,
          lessons: [
            { title: '¿Qué es el subjuntivo?', type: 'video', duration: 20, order: 1 },
            { title: 'Usos del subjuntivo', type: 'video', duration: 18, order: 2 },
            { title: 'Quiz: Subjuntivo', type: 'quiz', order: 3 },
          ],
        },
      ],
    },
    {
      title: 'Español Avanzado: Redacción y Elocuencia',
      slug: 'espanol-avanzado-redaccion-elocuencia',
      description: `Domina el español escrito y hablado a nivel avanzado. Ideal para profesionales y académicos.

Incluye:
- Redacción formal e informal
- Técnicas de oratoria
- Análisis literario
- Español académico y profesional
- DELE preparation`,
      shortDescription: 'Perfecciona tu español escrito y hablado con técnicas avanzadas.',
      tutor: tutors[1]._id,
      thumbnailUrl: '',
      price: 75000,
      language: 'spanish',
      level: 'advanced',
      isPublished: true,
      isActive: true,
      category: 'redaccion',
      tags: ['español', 'avanzado', 'redacción', 'DELE'],
      enrolledCount: 11,
      rating: 4.8,
      reviewCount: 4,
      totalDuration: 2700,
      totalLessons: 22,
      modules: [
        {
          title: 'Redacción Formal',
          order: 1,
          lessons: [
            { title: 'Estructura del ensayo', type: 'video', duration: 22, order: 1 },
            { title: 'Conectores discursivos', type: 'pdf', order: 2 },
            { title: 'Ejercicio: Escribe un ensayo', type: 'assignment', order: 3 },
          ],
        },
      ],
    },
  ]);

  console.log(`Creados: ${courses.length} cursos`);
  console.log('\n=== CUENTAS DE PRUEBA ===');
  console.log('Admin:    admin@lms.com    / Test1234');
  console.log('Tutor:    maria@lms.com   / Test1234');
  console.log('Tutor:    carlos@lms.com  / Test1234');
  console.log('Tutor:    sarah@lms.com   / Test1234');
  console.log('Tutor:    ana@lms.com     / Test1234');
  console.log('Estudiante: student@lms.com / Test1234');
  console.log('\nSeed completado exitosamente!');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});