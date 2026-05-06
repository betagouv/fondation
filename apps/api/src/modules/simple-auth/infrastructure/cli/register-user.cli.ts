import { type QuestionMap } from 'inquirer';
import { CommandRunner, InquirerService, Option, SubCommand } from 'nest-commander';
import z from 'zod';

import { Gender, Role } from 'shared-models';

import { SimpleAuthService } from '../../simple-auth.service';

const RegisterUserKey = {
  gender: 'gender',
  role: 'role',
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'email',
  password: 'password',
} as const;

type RegisterUserOptions = {
  [RegisterUserKey.gender]: Gender;
  [RegisterUserKey.role]: Role;
  [RegisterUserKey.firstName]: string;
  [RegisterUserKey.lastName]: string;
  [RegisterUserKey.email]: string;
  [RegisterUserKey.password]: string;
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
          type: 'list',
          name: 'role',
          choices: Object.values(Role),
          message: 'role:',
        },
        {
          type: 'list',
          name: 'gender',
          choices: Object.values(Gender),
          message: 'gender:',
        },
        { type: 'input', name: 'firstName', message: 'first name:' },
        { type: 'input', name: 'lastName', message: 'last name:' },
        {
          type: 'input',
          name: 'email',
          message: 'email:',
          validate: (input: string) => {
            const result = z.email().safeParse(input);
            if (!result.success) return z.prettifyError(result.error);
            return result.success;
          },
        },
        { type: 'password', name: 'password', message: 'password:', mask: '*' },
        {
          type: 'password',
          name: 'repeatPassword',
          message: 'repeat password:',
          mask: '*',
          validate: (input: string, answers: { password: string }) =>
            input === answers.password ? true : `Passwords should be identical`,
        },
      ] as const
    ).filter((prompt) => !(options as any)[prompt.name]);

    const answers = await this.inquirer.inquirer.prompt<{
      role: Role;
      gender: Gender;
      email: string;
      firstName: string;
      lastName: string;
      password: string;
    }>(prompts, options);
    await this.auth.registerUser(answers);
  }

  @Option({
    choices: Object.values(Role),
    flags: '-r, --role <role>',
    name: RegisterUserKey.role,
  })
  parseRole(role: Role) {
    return role;
  }

  @Option({
    choices: Object.values(Gender),
    flags: '-g, --gender <gender>',
    name: RegisterUserKey.gender,
  })
  parseGender(gender: Gender) {
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
