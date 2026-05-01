import { Body, Controller, Post, UseGuards, UsePipes } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { createZodDto, ZodValidationPipe } from 'nestjs-zod';
import z from 'zod';
import { PrismaService } from '../framework/database';
import { DevelopmentEnvironmentGuard } from '../simple-auth/infrastructure/guards/development-environment.guard';

class CreateJurisdictionsTestDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        codejur: z.string(),
        typeJur: z.string(),
        adr1: z.string().nullish(),
        adr2: z.string().nullish(),
        arrondissement: z.string().nullish(),
        codepos: z.string().nullish(),
        libelle: z.string().nullish(),
        ressort: z.string().nullish(),
        villeJur: z.string().nullish(),
        ville: z.string().nullish(),
      }),
    ),
  }),
) {}

const magistratNameSchema = z
  .string()
  .trim()
  .nonempty()
  .transform((x) => x.toLowerCase());
class CreateMagistratTestDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        externalId: z
          .number()
          .int()
          .gt(0)
          .transform((x) => x.toString()),
        civilite: z.enum(['M.', 'MME']).default('M.'),
        firstName: magistratNameSchema,
        lastName: magistratNameSchema,
        usedName: magistratNameSchema.nullish(),
        marriedName: magistratNameSchema.nullish(),
      }),
    ),
  }),
) {}

@ApiExcludeController()
@Controller('/_/data')
@UseGuards(DevelopmentEnvironmentGuard)
export class DataTestController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('/jurisdictions')
  @UsePipes(ZodValidationPipe)
  async createJurisdictions(@Body() body: CreateJurisdictionsTestDto) {
    await this.prisma.jurisdiction.createMany({
      skipDuplicates: true,
      data: body.items.map((item) => ({ ...item, ville_jur: item.villeJur })),
    });
  }

  @Post('/magistrats')
  @UsePipes(ZodValidationPipe)
  async createMagistrats(
    @Body() { items: data }: CreateMagistratTestDto,
  ): Promise<void> {
    await this.prisma.magistrat.createMany({
      data,
      skipDuplicates: true,
    });
  }
}
