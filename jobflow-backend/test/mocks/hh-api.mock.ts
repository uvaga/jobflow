import { Injectable } from '@nestjs/common';

/**
 * Mock implementation of HhApiService for testing
 * Returns hardcoded test data instead of making real API calls
 */
@Injectable()
export class MockHhApiService {
  // Mock vacancy data
  private mockVacancies = [
    {
      id: '100000001',
      name: 'Senior JavaScript Developer',
      employer: {
        id: '1000',
        name: 'TechCorp',
        url: 'https://api.hh.ru/employers/1000',
        logoUrls: {
          '240': 'https://example.com/logo.png',
        },
        trusted: true,
      },
      salary: {
        from: 150000,
        to: 250000,
        currency: 'RUR',
        gross: false,
      },
      area: {
        id: '1',
        name: 'Moscow',
        url: 'https://api.hh.ru/areas/1',
      },
      url: 'https://hh.ru/vacancy/100000001',
      description: '<p>We are looking for a Senior JavaScript Developer...</p>',
      schedule: {
        id: 'remote',
        name: 'Remote working',
      },
      experience: {
        id: 'between3And6',
        name: '3–6 years',
      },
      employment: {
        id: 'full',
        name: 'Full-time employment',
      },
      publishedAt: new Date().toISOString(),
    },
    {
      id: '100000002',
      name: 'Frontend React Developer',
      employer: {
        id: '1001',
        name: 'StartupHub',
        url: 'https://api.hh.ru/employers/1001',
        logoUrls: {},
        trusted: false,
      },
      salary: {
        from: 100000,
        to: 180000,
        currency: 'RUR',
        gross: false,
      },
      area: {
        id: '2',
        name: 'Saint Petersburg',
        url: 'https://api.hh.ru/areas/2',
      },
      url: 'https://hh.ru/vacancy/100000002',
      description: '<p>Join our team as a Frontend React Developer...</p>',
      schedule: {
        id: 'fullDay',
        name: 'Full-time',
      },
      experience: {
        id: 'between1And3',
        name: '1–3 years',
      },
      employment: {
        id: 'full',
        name: 'Full-time employment',
      },
      publishedAt: new Date().toISOString(),
    },
    {
      id: '100000003',
      name: 'Node.js Backend Developer',
      employer: {
        id: '1002',
        name: 'DevCompany',
        url: 'https://api.hh.ru/employers/1002',
        logoUrls: {
          '240': 'https://example.com/logo2.png',
        },
        trusted: true,
      },
      salary: {
        from: 120000,
        to: 200000,
        currency: 'RUR',
        gross: false,
      },
      area: {
        id: '1',
        name: 'Moscow',
        url: 'https://api.hh.ru/areas/1',
      },
      url: 'https://hh.ru/vacancy/100000003',
      description: '<p>We need a talented Node.js Backend Developer...</p>',
      schedule: {
        id: 'remote',
        name: 'Remote working',
      },
      experience: {
        id: 'between3And6',
        name: '3–6 years',
      },
      employment: {
        id: 'full',
        name: 'Full-time employment',
      },
      publishedAt: new Date().toISOString(),
    },
  ];

  async searchVacancies(params?: any): Promise<any> {
    // Filter vacancies based on search text if provided
    let items = this.mockVacancies;

    if (params?.text) {
      const searchText = params.text.toLowerCase();
      items = items.filter(
        (v) =>
          v.name.toLowerCase().includes(searchText) ||
          v.description.toLowerCase().includes(searchText),
      );
    }

    // Apply pagination
    const perPage = params?.per_page || 20;
    const page = params?.page || 0;
    const start = page * perPage;
    const paginatedItems = items.slice(start, start + perPage);

    return {
      items: paginatedItems,
      found: items.length,
      pages: Math.ceil(items.length / perPage),
      page: page,
      per_page: perPage,
    };
  }

  async getVacancyById(id: string): Promise<any> {
    const vacancy = this.mockVacancies.find((v) => v.id === id);

    if (!vacancy) {
      throw new Error(`Vacancy with id ${id} not found`);
    }

    return vacancy;
  }

  async getDictionaries(): Promise<any> {
    return {
      experience: [
        { id: 'noExperience', name: 'No experience' },
        { id: 'between1And3', name: '1–3 years' },
        { id: 'between3And6', name: '3–6 years' },
        { id: 'moreThan6', name: 'More than 6 years' },
      ],
      employment: [
        { id: 'full', name: 'Full-time employment' },
        { id: 'part', name: 'Part-time employment' },
        { id: 'project', name: 'Project work' },
        { id: 'volunteer', name: 'Volunteer' },
      ],
      schedule: [
        { id: 'fullDay', name: 'Full-time' },
        { id: 'shift', name: 'Shift work' },
        { id: 'flexible', name: 'Flexible schedule' },
        { id: 'remote', name: 'Remote working' },
      ],
    };
  }

  async getAreas(): Promise<any> {
    return [
      { id: '1', name: 'Moscow', areas: [] },
      { id: '2', name: 'Saint Petersburg', areas: [] },
      { id: '113', name: 'Russia', areas: [] },
    ];
  }
}
