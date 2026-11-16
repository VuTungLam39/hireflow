import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { api } from '@/test/msw/http'
import { jobsApi } from './jobs.api'

const bodies: string[] = []
const server = setupServer(
  http.post(api('/jobs/:id/requirements/suggest'), async ({ request }) => {
    bodies.push(await request.text())
    return HttpResponse.json({ success: true, statusCode: 200, data: [] })
  }),
)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

describe('jobsApi', () => {
  it('US-02: suggesting requirements sends no body, since Express rejects a "null" JSON body with 400', async () => {
    await expect(jobsApi.suggestRequirements('job-1')).resolves.toEqual([])
    expect(bodies).toEqual([''])
  })
})
