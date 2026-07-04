import { describe, expect, it } from 'vitest'
import { isEmailAllowed } from './allowed-emails'

describe('isEmailAllowed', () => {
  it('allows emails listed in ALLOWED_EMAILS ignoring case and spaces', () => {
    expect(
      isEmailAllowed(
        'gabriel.bertola.souza@gmail.com, outro@email.com',
        ' GABRIEL.BERTOLA.SOUZA@gmail.com ',
      ),
    ).toBe(true)
  })

  it('denies emails that are not listed in ALLOWED_EMAILS', () => {
    expect(
      isEmailAllowed(
        'gabriel.bertola.souza@gmail.com,outro@email.com',
        'nao-autorizado@email.com',
      ),
    ).toBe(false)
  })

  it('denies missing user emails', () => {
    expect(isEmailAllowed('gabriel.bertola.souza@gmail.com', null)).toBe(false)
  })
})
