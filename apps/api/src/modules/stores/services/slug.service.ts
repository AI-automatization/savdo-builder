import { Injectable } from '@nestjs/common';
import { StoresRepository } from '../repositories/stores.repository';

@Injectable()
export class SlugService {
  constructor(private readonly storesRepo: StoresRepository) {}

  generate(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'store';
  }

  async generateUnique(name: string): Promise<string> {
    let slug = this.generate(name);
    let attempt = 0;

    while (await this.storesRepo.existsBySlug(slug)) {
      attempt++;
      slug = `${this.generate(name)}-${attempt}`;
    }

    return slug;
  }
}
