import bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/database';
import { Hospital } from '../entities/Hospital';
import { User, UserRole } from '../entities/User';
import { Questionnaire } from '../entities/Questionnaire';
import { Question } from '../entities/Question';
import { QuestionTranslation } from '../entities/QuestionTranslation';
import { QuestionOption } from '../entities/QuestionOption';
import { QuestionOptionTranslation } from '../entities/QuestionOptionTranslation';

async function seed() {
  await AppDataSource.initialize();
  console.log('Data Source has been initialized!');

  const hospitalRepo = AppDataSource.getRepository(Hospital);
  const userRepo = AppDataSource.getRepository(User);
  const questionnaireRepo = AppDataSource.getRepository(Questionnaire);
  const questionRepo = AppDataSource.getRepository(Question);
  const qTranslationRepo = AppDataSource.getRepository(QuestionTranslation);
  const optionRepo = AppDataSource.getRepository(QuestionOption);
  const oTranslationRepo = AppDataSource.getRepository(QuestionOptionTranslation);

  // 1. Create Hospital
  let hospital = await hospitalRepo.findOneBy({ code: 'HOSP001' });
  if (!hospital) {
    hospital = hospitalRepo.create({
      name: 'General Hospital',
      code: 'HOSP001',
    });
    await hospitalRepo.save(hospital);
    console.log('Hospital created');
  }

  // 2. Create Users
  const roles = [UserRole.CLINIC, UserRole.DOCTOR, UserRole.TECHNOLOGIST];
  const passwordHash = await bcrypt.hash('password123', 10);

  for (const role of roles) {
    let user = await userRepo.findOneBy({ username: `${role}1`, hospital_id: hospital.id });
    if (!user) {
      user = userRepo.create({
        username: `${role}1`,
        password_hash: passwordHash,
        role: role,
        hospital_id: hospital.id,
      });
      await userRepo.save(user);
      console.log(`User ${user.username} created`);
    }
  }

  // 3. Create Questionnaire
  let questionnaire = await questionnaireRepo.findOneBy({ code: 'BREAST_SCREENING' });
  if (!questionnaire) {
    questionnaire = questionnaireRepo.create({
      code: 'BREAST_SCREENING',
      version: 1,
      is_active: true,
    });
    await questionnaireRepo.save(questionnaire);

    // Age Question
    const q1 = questionRepo.create({
      questionnaire_id: questionnaire.id,
      code: 'AGE',
      type: 'numeric',
      order: 1,
    });
    await questionRepo.save(q1);

    await qTranslationRepo.save([
      { question_id: q1.id, language_code: 'en-IN', text: 'What is your age?' },
      { question_id: q1.id, language_code: 'ta-IN', text: 'உங்கள் வயது என்ன?' },
    ]);

    // Family History Question
    const q2 = questionRepo.create({
      questionnaire_id: questionnaire.id,
      code: 'FAMILY_HISTORY',
      type: 'single-choice',
      order: 2,
    });
    await questionRepo.save(q2);

    await qTranslationRepo.save([
      { question_id: q2.id, language_code: 'en-IN', text: 'Do you have a family history?' },
      { question_id: q2.id, language_code: 'ta-IN', text: 'உங்களுக்கு குடும்ப வரலாறு உள்ளதா?' },
    ]);

    const o1 = optionRepo.create({ question_id: q2.id, code: 'YES', order: 1, value: 'true' });
    const o2 = optionRepo.create({ question_id: q2.id, code: 'NO', order: 2, value: 'false' });
    await optionRepo.save([o1, o2]);

    await oTranslationRepo.save([
      { option_id: o1.id, language_code: 'en-IN', label: 'Yes' },
      { option_id: o1.id, language_code: 'ta-IN', label: 'ஆம்' },
      { option_id: o2.id, language_code: 'en-IN', label: 'No' },
      { option_id: o2.id, language_code: 'ta-IN', label: 'இல்லை' },
    ]);

    console.log('Questionnaire created');
  }

  await AppDataSource.destroy();
}

seed().catch((error) => console.log(error));
