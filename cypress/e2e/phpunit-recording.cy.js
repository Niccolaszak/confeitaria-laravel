describe('Gravação dos exercícios PHPUnit 21 a 30', () => {
  it('executa php artisan test e exibe o resultado', () => {
    cy.visit('/')

    cy.task('runPhpUnit', null, { timeout: 180000 }).then((output) => {
      cy.document().then((document) => {
        const heading = document.createElement('h1')
        heading.textContent = 'PHPUnit — exercícios 21 a 30'

        const command = document.createElement('p')
        command.textContent = 'Comando executado: php artisan test'

        const result = document.createElement('pre')
        result.textContent = output
        result.style.cssText = 'white-space:pre-wrap;overflow:auto;max-height:78vh;background:#171717;color:#f5f5f5;padding:1rem;font:14px/1.4 monospace'

        document.body.replaceChildren(heading, command, result)
        document.body.style.cssText = 'margin:2rem;font:16px system-ui;color:#222'
      })

      cy.get('body').should('contain.text', 'PHPUnit — exercícios 21 a 30')
      cy.get('pre').should('not.be.empty')
    })
  })
})
