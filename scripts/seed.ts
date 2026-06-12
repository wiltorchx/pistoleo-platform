import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function init() {
  const { createClient } = await import('@supabase/supabase-js');
  const bcrypt = (await import('bcryptjs')).default;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  return { supabase, bcrypt };
}

const { supabase, bcrypt } = await init();

async function seed() {
  const passwordHash = await bcrypt.hash('Test1234', 12);

  // Clean existing data
  await supabase.from('enrollments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Create Admin
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: _admin } = await supabase.from('users').insert({
    first_name: 'Admin',
    last_name: 'Sistema',
    email: 'admin@lms.com',
    password: passwordHash,
    role: 'admin',
    terms_accepted: true,
    email_verified: true,
  }).select().single();

  // Create Tutors
  const tutorsData = [
    {
      first_name: 'María', last_name: 'González', email: 'maria@lms.com',
      password: passwordHash, role: 'tutor',
      bio: 'Profesora de inglés certificada con 8 años de experiencia. Especialista en conversación y preparación TOEFL.',
      hourly_rate: 25, terms_accepted: true, email_verified: true,
    },
    {
      first_name: 'Carlos', last_name: 'Rodríguez', email: 'carlos@lms.com',
      password: passwordHash, role: 'tutor',
      bio: 'Tutor de español nativo con maestría en lingüística. Enseño español de negocios y cultura latinoamericana.',
      hourly_rate: 20, terms_accepted: true, email_verified: true,
    },
    {
      first_name: 'Sarah', last_name: 'Johnson', email: 'sarah@lms.com',
      password: passwordHash, role: 'tutor',
      bio: 'Native English speaker from New York. I specialize in beginner English and pronunciation.',
      hourly_rate: 22, terms_accepted: true, email_verified: true,
    },
    {
      first_name: 'Ana', last_name: 'Martínez', email: 'ana@lms.com',
      password: passwordHash, role: 'tutor',
      bio: 'Profesora de español e inglés. Bilingüe con experiencia enseñando a estudiantes de todos los niveles.',
      hourly_rate: 18, terms_accepted: true, email_verified: true,
    },
  ];

  const { data: tutors } = await supabase.from('users').insert(tutorsData).select();

  // Create Student
  await supabase.from('users').insert({
    first_name: 'Estudiante', last_name: 'Prueba', email: 'student@lms.com',
    password: passwordHash, role: 'student', terms_accepted: true, email_verified: true,
  });

  console.log(`Creados: ${tutors?.length || 0} tutores, 1 admin, 1 estudiante`);

  const coursesData = [
    {
      title: 'Inglés para Principiantes: De Cero a Conversar',
      slug: 'ingles-principiantes-cero-conversar',
      description: 'Aprende inglés desde cero con este curso completo diseñado para hispanohablantes.\n\nEn este curso cubriremos:\n- Vocabulario básico de la vida diaria\n- Gramática fundamental (presente, pasado, futuro)\n- Pronunciación y entonación\n- Conversaciones prácticas para viajar, trabajar y socializar\n- Ejercicios de escucha y comprensión\n\nAl finalizar, podrás mantener conversaciones básicas en inglés con confianza.',
      short_description: 'Curso completo de inglés para hispanohablantes sin experiencia previa.',
      tutor_id: tutors?.[0]?.id,
      price: 45000,
      language: 'english',
      level: 'beginner',
      is_published: true,
      category: 'conversacion',
      tags: ['inglés', 'principiante', 'conversación'],
      enrolled_count: 34,
      rating: 4.8,
      review_count: 12,
      total_duration: 1800,
      total_lessons: 24,
      modules: JSON.parse(JSON.stringify([
        { title: 'Saludos y Presentaciones', order: 1, lessons: [
          { title: 'Hello! Saludos básicos', type: 'video', duration: 15, order: 1 },
          { title: 'My name is... Presentándose', type: 'video', duration: 12, order: 2 },
          { title: 'Vocabulario: Saludos', type: 'pdf', order: 3 },
          { title: 'Quiz: Saludos', type: 'quiz', order: 4 },
        ]},
        { title: 'La Familia y la Casa', order: 2, lessons: [
          { title: 'Mi familia - Vocabulario', type: 'video', duration: 18, order: 1 },
          { title: 'This is my house', type: 'video', duration: 14, order: 2 },
          { title: 'Ejercicio: Describe tu familia', type: 'assignment', order: 3 },
        ]},
        { title: 'Comida y Restaurante', order: 3, lessons: [
          { title: 'En el restaurante', type: 'video', duration: 20, order: 1 },
          { title: 'Vocabulario: Comida y bebidas', type: 'pdf', order: 2 },
          { title: 'I would like... Ordenando', type: 'video', duration: 16, order: 3 },
          { title: 'Quiz: En el restaurante', type: 'quiz', order: 4 },
        ]},
      ])),
    },
    {
      title: 'Inglés Intermedio: Fluidez y Confianza',
      slug: 'ingles-intermedio-fluidez-confianza',
      description: 'Lleva tu inglés al siguiente nivel. Este curso está diseñado para estudiantes que ya tienen una base y quieren ganar fluidez.\n\nTemas principales:\n- Tiempos verbales avanzados (Present Perfect, Past Continuous)\n- Phrasal verbs esenciales\n- Conversaciones de negocios\n- Expresiones idiomáticas comunes\n- Técnicas de presentación en inglés\n\nDesarrolla confianza para participar en reuniones, entrevistas y situaciones sociales en inglés.',
      short_description: 'Perfecciona tu inglés intermedio con conversaciones reales y gramática avanzada.',
      tutor_id: tutors?.[0]?.id,
      price: 65000,
      language: 'english',
      level: 'intermediate',
      is_published: true,
      category: 'conversacion',
      tags: ['inglés', 'intermedio', 'negocios'],
      enrolled_count: 22,
      rating: 4.6,
      review_count: 8,
      total_duration: 2400,
      total_lessons: 32,
      modules: JSON.parse(JSON.stringify([
        { title: 'Tiempos Verbales Avanzados', order: 1, lessons: [
          { title: 'Present Perfect - ¿Cuándo usarlo?', type: 'video', duration: 22, order: 1 },
          { title: 'Past Continuous vs Simple Past', type: 'video', duration: 18, order: 2 },
          { title: 'Ejercicios de práctica', type: 'assignment', order: 3 },
        ]},
        { title: 'Phrasal Verbs del Día a Día', order: 2, lessons: [
          { title: 'Phrasal verbs con "Get"', type: 'video', duration: 16, order: 1 },
          { title: 'Phrasal verbs con "Take"', type: 'video', duration: 14, order: 2 },
          { title: 'Lista de phrasal verbs esenciales', type: 'pdf', order: 3 },
          { title: 'Quiz: Phrasal Verbs', type: 'quiz', order: 4 },
        ]},
      ])),
    },
    {
      title: 'Inglés Avanzado: Dominio Profesional',
      slug: 'ingles-avanzado-dominio-profesional',
      description: 'Curso avanzado para profesionales que necesitan dominar el inglés en entornos corporativos.\n\nIncluye:\n- Presentaciones ejecutivas en inglés\n- Negociaciones y reuniones\n- Escritura de emails profesionales\n- Inglés legal y financiero\n- Preparación para certificaciones (TOEFL, IELTS)',
      short_description: 'Domina el inglés profesional para reuniones, presentaciones y negociaciones.',
      tutor_id: tutors?.[2]?.id,
      price: 85000,
      language: 'english',
      level: 'advanced',
      is_published: true,
      category: 'negocios',
      tags: ['inglés', 'avanzado', 'negocios', 'TOEFL'],
      enrolled_count: 15,
      rating: 4.9,
      review_count: 6,
      total_duration: 3000,
      total_lessons: 28,
      modules: JSON.parse(JSON.stringify([
        { title: 'Presentaciones Ejecutivas', order: 1, lessons: [
          { title: 'Estructura de una presentación profesional', type: 'video', duration: 25, order: 1 },
          { title: 'Vocabulario corporativo esencial', type: 'pdf', order: 2 },
          { title: 'Práctica: Tu primera presentación', type: 'assignment', order: 3 },
        ]},
      ])),
    },
    {
      title: 'Español para Extranjeros: Nivel Inicial',
      slug: 'espanol-extranjeros-nivel-inicial',
      description: 'Learn Spanish from scratch! This course is designed for English speakers who want to learn Spanish.\n\nYou will learn:\n- Basic Spanish vocabulary and phrases\n- Essential grammar (present tense, ser vs estar)\n- Pronunciation and accent\n- Practical conversations for travel and daily life\n- Cultural insights about Latin America',
      short_description: 'Aprende español desde cero con clases prácticas y dinámicas.',
      tutor_id: tutors?.[1]?.id,
      price: 40000,
      language: 'spanish',
      level: 'beginner',
      is_published: true,
      category: 'conversacion',
      tags: ['español', 'principiante', 'extranjeros'],
      enrolled_count: 28,
      rating: 4.7,
      review_count: 10,
      total_duration: 1500,
      total_lessons: 20,
      modules: JSON.parse(JSON.stringify([
        { title: 'Primeros Pasos en Español', order: 1, lessons: [
          { title: '¡Hola! Basic greetings', type: 'video', duration: 14, order: 1 },
          { title: 'El alfabeto español', type: 'video', duration: 10, order: 2 },
          { title: 'Numbers 1-100', type: 'video', duration: 12, order: 3 },
          { title: 'Quiz: Lo básico', type: 'quiz', order: 4 },
        ]},
        { title: 'Ser vs Estar', order: 2, lessons: [
          { title: 'When to use "Ser"', type: 'video', duration: 18, order: 1 },
          { title: 'When to use "Estar"', type: 'video', duration: 16, order: 2 },
          { title: 'Practice exercises', type: 'assignment', order: 3 },
        ]},
      ])),
    },
    {
      title: 'Español Intermedio: Conversación y Cultura',
      slug: 'espanol-intermedio-conversacion-cultura',
      description: 'Mejora tu español con conversaciones auténticas y sumérgete en la cultura latinoamericana.\n\nContenido:\n- Subjuntivo y sus usos\n- Expresiones coloquiales\n- Cultura y tradiciones de Latinoamérica\n- Conversaciones sobre actualidad\n- Español de negocios',
      short_description: 'Mejora tu fluidez en español con conversaciones reales y contenido cultural.',
      tutor_id: tutors?.[3]?.id,
      price: 55000,
      language: 'spanish',
      level: 'intermediate',
      is_published: true,
      category: 'conversacion',
      tags: ['español', 'intermedio', 'cultura'],
      enrolled_count: 19,
      rating: 4.5,
      review_count: 7,
      total_duration: 2100,
      total_lessons: 26,
      modules: JSON.parse(JSON.stringify([
        { title: 'El Subjuntivo', order: 1, lessons: [
          { title: '¿Qué es el subjuntivo?', type: 'video', duration: 20, order: 1 },
          { title: 'Usos del subjuntivo', type: 'video', duration: 18, order: 2 },
          { title: 'Quiz: Subjuntivo', type: 'quiz', order: 3 },
        ]},
      ])),
    },
    {
      title: 'Español Avanzado: Redacción y Elocuencia',
      slug: 'espanol-avanzado-redaccion-elocuencia',
      description: 'Domina el español escrito y hablado a nivel avanzado. Ideal para profesionales y académicos.\n\nIncluye:\n- Redacción formal e informal\n- Técnicas de oratoria\n- Análisis literario\n- Español académico y profesional\n- DELE preparation',
      short_description: 'Perfecciona tu español escrito y hablado con técnicas avanzadas.',
      tutor_id: tutors?.[1]?.id,
      price: 75000,
      language: 'spanish',
      level: 'advanced',
      is_published: true,
      category: 'redaccion',
      tags: ['español', 'avanzado', 'redacción', 'DELE'],
      enrolled_count: 11,
      rating: 4.8,
      review_count: 4,
      total_duration: 2700,
      total_lessons: 22,
      modules: JSON.parse(JSON.stringify([
        { title: 'Redacción Formal', order: 1, lessons: [
          { title: 'Estructura del ensayo', type: 'video', duration: 22, order: 1 },
          { title: 'Conectores discursivos', type: 'pdf', order: 2 },
          { title: 'Ejercicio: Escribe un ensayo', type: 'assignment', order: 3 },
        ]},
      ])),
    },
  ];

  const { data: courses } = await supabase.from('courses').insert(coursesData).select();
  console.log(`Creados: ${courses?.length || 0} cursos`);

  console.log('\n=== CUENTAS DE PRUEBA ===');
  console.log('Admin:    admin@lms.com    / Test1234');
  console.log('Tutor:    maria@lms.com   / Test1234');
  console.log('Tutor:    carlos@lms.com  / Test1234');
  console.log('Tutor:    sarah@lms.com   / Test1234');
  console.log('Tutor:    ana@lms.com     / Test1234');
  console.log('Estudiante: student@lms.com / Test1234');
  console.log('\nSeed completado exitosamente!');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
