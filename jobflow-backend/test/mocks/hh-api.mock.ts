import { Injectable, NotFoundException } from '@nestjs/common';
import { testVacancies } from '../fixtures/test-data';

/**
 * Mock implementation of HhApiService for testing
 * Returns hardcoded test data instead of making real API calls
 */
@Injectable()
export class MockHhApiService {
  // Mock vacancy data (hh.ru API format - snake_case)
  private mockVacancies = [
    {
      id: '100000001',
      name: 'Senior JavaScript Developer',
      employer: {
        id: '1000',
        name: 'TechCorp',
        url: 'https://api.hh.ru/employers/1000',
        logo_urls: {
          '240': 'https://example.com/logo.png',
          '90': 'https://example.com/logo-sm.png',
        },
        alternate_url: 'https://hh.ru/employer/1000',
        trusted: true,
        accredited_it_employer: true,
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
      url: 'https://api.hh.ru/vacancies/100000001',
      alternate_url: 'https://hh.ru/vacancy/100000001',
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
      key_skills: [
        { name: 'JavaScript' },
        { name: 'TypeScript' },
        { name: 'Node.js' },
      ],
      professional_roles: [
        { id: '96', name: 'Programmer, developer' },
      ],
      work_format: [
        { id: 'remote', name: 'Remote' },
      ],
      working_hours: [
        { id: 'full_day', name: 'Full day' },
      ],
      address: null,
      contacts: null,
      accept_handicapped: false,
      accept_kids: false,
      accept_temporary: false,
      accept_incomplete_resumes: true,
      published_at: new Date().toISOString(),
    },
    {
      id: '100000002',
      name: 'Frontend React JavaScript Developer',
      employer: {
        id: '1001',
        name: 'StartupHub',
        url: 'https://api.hh.ru/employers/1001',
        logo_urls: {},
        alternate_url: 'https://hh.ru/employer/1001',
        trusted: false,
        accredited_it_employer: false,
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
      url: 'https://api.hh.ru/vacancies/100000002',
      alternate_url: 'https://hh.ru/vacancy/100000002',
      description: '<p>Join our team as a Frontend React JavaScript Developer...</p>',
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
      key_skills: [
        { name: 'React' },
        { name: 'JavaScript' },
      ],
      professional_roles: [
        { id: '96', name: 'Programmer, developer' },
      ],
      work_format: null,
      working_hours: null,
      address: null,
      contacts: null,
      accept_handicapped: false,
      accept_kids: false,
      accept_temporary: false,
      accept_incomplete_resumes: false,
      published_at: new Date().toISOString(),
    },
    {
      id: '100000003',
      name: 'Node.js JavaScript Backend Developer',
      employer: {
        id: '1002',
        name: 'DevCompany',
        url: 'https://api.hh.ru/employers/1002',
        logo_urls: {
          '240': 'https://example.com/logo2.png',
        },
        alternate_url: 'https://hh.ru/employer/1002',
        trusted: true,
        accredited_it_employer: false,
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
      url: 'https://api.hh.ru/vacancies/100000003',
      alternate_url: 'https://hh.ru/vacancy/100000003',
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
      key_skills: [
        { name: 'Node.js' },
        { name: 'Express' },
        { name: 'MongoDB' },
      ],
      professional_roles: [
        { id: '96', name: 'Programmer, developer' },
      ],
      work_format: [
        { id: 'remote', name: 'Remote' },
      ],
      working_hours: null,
      address: null,
      contacts: null,
      accept_handicapped: false,
      accept_kids: false,
      accept_temporary: false,
      accept_incomplete_resumes: true,
      published_at: new Date().toISOString(),
    },
  ];

  async searchVacancies(params?: any): Promise<any> {
    let items = this.mockVacancies;

    if (params?.text) {
      const searchText = params.text.toLowerCase();
      items = items.filter(
        (v) =>
          v.name.toLowerCase().includes(searchText) ||
          v.description.toLowerCase().includes(searchText),
      );
    }

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

    if (vacancy) {
      return vacancy;
    }

    if (id === testVacancies.invalidVacancyId || id.startsWith('999')) {
      throw new NotFoundException(`Vacancy ${id} not found`);
    }

    // Generate a mock vacancy for any other ID
    return {
      id,
      name: `Test Vacancy ${id}`,
      employer: {
        id: '1000',
        name: 'Test Company',
        url: 'https://api.hh.ru/employers/1000',
        logo_urls: {
          '240': 'https://example.com/logo.png',
        },
        alternate_url: 'https://hh.ru/employer/1000',
        trusted: true,
        accredited_it_employer: false,
      },
      salary: {
        from: 100000,
        to: 200000,
        currency: 'RUR',
        gross: false,
      },
      area: {
        id: '1',
        name: 'Moscow',
        url: 'https://api.hh.ru/areas/1',
      },
      url: `https://api.hh.ru/vacancies/${id}`,
      alternate_url: `https://hh.ru/vacancy/${id}`,
      description: `<p>Test vacancy description for ${id}</p>`,
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
      key_skills: [{ name: 'Testing' }],
      professional_roles: [{ id: '96', name: 'Programmer, developer' }],
      work_format: null,
      working_hours: null,
      address: null,
      contacts: null,
      accept_handicapped: false,
      accept_kids: false,
      accept_temporary: false,
      accept_incomplete_resumes: false,
      published_at: new Date().toISOString(),
    };
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
