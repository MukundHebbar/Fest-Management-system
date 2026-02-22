
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const autoGenerateCredentials = async (org_num) => {
    const email = `organizer${org_num}@felicity.iiit.ac.in`;
    const password = crypto.randomBytes(8).toString('hex'); // 16 characters
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    return { email, password, passwordHash };
}

export const autoGenPassword = async () => {
    const password = crypto.randomBytes(8).toString('hex'); // 16 characters
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    return {password, passwordHash};
}