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

@ApiExcludeController()
@Controller('/_/jurisdictions')
@UseGuards(DevelopmentEnvironmentGuard)
export class JurisdictionTestController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @UsePipes(ZodValidationPipe)
  async createJurisdictions(@Body() body: CreateJurisdictionsTestDto) {
    await this.prisma.jurisdiction.createMany({
      skipDuplicates: true,
      data: body.items.map((item) => ({ ...item, ville_jur: item.villeJur })),
    });
  }
}
