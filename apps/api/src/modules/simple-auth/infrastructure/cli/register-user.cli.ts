import { type QuestionMap } from 'inquirer';
import { CommandRunner, InquirerService, Option, SubCommand } from 'nest-commander';
import z from 'zod';

import { GenderEnum } from '../../../shared/gender.enum';
import { PasswordSchema } from '../../../shared/password.schema';
import { RoleEnum } from '../../../shared/role.enum';
import { SimpleAuthService } from '../../simple-auth.service';

const RegisterUserKey = {
  email: 'email',
  firstName: 'firstName',
  gender: 'gender',
  isAdmin: 'isAdmin',
  lastName: 'lastName',
  password: 'password',
  role: 'role',
} as const;

type RegisterUserOptions = {
  [RegisterUserKey.email]: string;
  [RegisterUserKey.firstName]: string;
  [RegisterUserKey.gender]: GenderEnum;
  [RegisterUserKey.isAdmin]?: boolean;
  [RegisterUserKey.lastName]: string;
  [RegisterUserKey.password]: string;
  [RegisterUserKey.role]: RoleEnum;
};

@SubCommand({ name: 'register' })
export class RegisterUserCliCommand extends CommandRunner {
  constructor(
    private readonly inquirer: InquirerService,
    private readonly auth: SimpleAuthService,
  ) {
    super();
  }

  async run(_inputs: string[], options: RegisterUserOptions) {
    const prompts: QuestionMap[keyof QuestionMap][] = (
      [
        {
          choices: Object.values(RoleEnum),
          message: 'role:',
          name: 'role',
          type: 'list',
        },
        {
          choices: Object.values(GenderEnum),
          message: 'gender:',
          name: 'gender',
          type: 'list',
        },
        { message: 'first name:', name: 'firstName', type: 'input' },
        { message: 'last name:', name: 'lastName', type: 'input' },
        {
          message: 'email:',
          name: 'email',
          type: 'input',
          validate: (input: string) => {
            const result = z.email().safeParse(input);
            if (!result.success) return z.prettifyError(result.error);
            return result.success;
          },
        },
        {
          mask: '*',
          message: 'password:',
          name: 'password',
          type: 'password',
          validate: (input: string) => {
            const result = PasswordSchema.safeParse(input);
            return result.success || z.prettifyError(result.error);
          },
        },
        {
          mask: '*',
          message: 'repeat password:',
          name: 'repeatPassword',
          type: 'password',
          validate: (input: string, answers: { password: string }) =>
            input === answers.password ? true : `Passwords should be identical`,
        },
      ] as const
    ).filter((prompt) => !(options as any)[prompt.name]);

    const answers = await this.inquirer.inquirer.prompt<{
      email: string;
      firstName: string;
      gender: GenderEnum;
      lastName: string;
      password: string;
      role: RoleEnum;
    }>(prompts, options);
    await this.auth.registerUser({
      ...answers,
      isAdmin: options.isAdmin ?? false,
      password: PasswordSchema.parse(answers.password),
    });
  }

  @Option({
    description: 'gives the admin right, to a member of the general secretariat only',
    flags: '-a, --admin',
    name: RegisterUserKey.isAdmin,
  })
  parseIsAdmin(): boolean {
    return true;
  }

  @Option({
    choices: Object.values(RoleEnum),
    flags: '-r, --role <role>',
    name: RegisterUserKey.role,
  })
  parseRole(role: RoleEnum) {
    return role;
  }

  @Option({
    choices: Object.values(GenderEnum),
    flags: '-g, --gender <gender>',
    name: RegisterUserKey.gender,
  })
  parseGender(gender: GenderEnum) {
    return gender;
  }

  @Option({
    flags: '-f, --firstname <first>',
    name: RegisterUserKey.firstName,
  })
  parseFirstName(firstName: string) {
    return firstName;
  }

  @Option({ flags: '-l, --lastname <last>', name: RegisterUserKey.lastName })
  parseLastName(lastName: string) {
    return lastName;
  }

  @Option({ flags: '-e, --email <email>', name: RegisterUserKey.email })
  parseEmail(email: string): string {
    return z.email().parse(email);
  }
}
