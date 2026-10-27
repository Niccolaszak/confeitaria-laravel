describe('Exercícios Cypress: Doce Gestão', () => {
  const selectOptionContaining = (selector, label) => cy.get(selector).then(($select) => {
    const option = [...$select[0].options].find((candidate) => candidate.textContent.includes(label))
    cy.wrap($select).select(option.value)
  })

  beforeEach(() => {
    cy.task('resetDatabase')
    cy.visit('/')
  })

  it('2. visita a página inicial e exibe o nome da confeitaria', () => {
    cy.contains('Doce Gestão').should('be.visible')
  })

  it('3. navega pelos módulos pelo menu', () => {
    const pages = [
      ['nav-products', '/produtos'],
      ['nav-customers', '/clientes'],
      ['nav-orders', '/pedidos'],
      ['nav-deliveries', '/entregas'],
    ]

    pages.forEach(([selector, path]) => {
      cy.get(`[data-cy="${selector}"]`).click()
      cy.url().should('include', path)
      cy.visit('/')
    })
  })

  it('4. mostra tabela, linhas semeadas e cabeçalhos de produtos', () => {
    cy.visit('/produtos')
    cy.get('[data-cy="products-table"]').should('exist').within(() => {
      cy.get('tbody tr').should('have.length.at.least', 1)
      cy.contains('th', 'Produto').should('be.visible')
      cy.contains('th', 'Categoria').should('be.visible')
      cy.contains('th', 'Estoque').should('be.visible')
      cy.get('th').eq(2).should('contain.text', 'Pre')
    })
  })

  it('5. abre o formulário de produto com os campos esperados', () => {
    cy.visit('/produtos')
    cy.get('[data-cy="new-product"]').click()
    cy.location('pathname').should('eq', '/produtos/create')
    cy.get('[data-cy="product-name"]').should('exist')
    cy.get('[data-cy="product-category"]').should('exist')
    cy.get('[data-cy="product-price"]').should('exist')
    cy.get('[data-cy="product-stock"]').should('exist')
    cy.get('[data-cy="product-minimum-stock"]').should('exist')
  })

  it('7. cadastra um produto usando fixture e confirma o redirecionamento', () => {
    cy.fixture('produto').then((produto) => cy.criarProduto(produto))
    cy.contains('Cupcake de teste').should('be.visible')
  })

  it('8. rejeita formulário de produto vazio nos campos obrigatórios', () => {
    cy.visit('/produtos/create')
    cy.get('[data-cy="product-form"]').submit()
    cy.get('[data-cy="product-name"]').should('have.prop', 'validity').its('valueMissing').should('be.true')
    cy.get('[data-cy="product-category"]').should('have.prop', 'validity').its('valueMissing').should('be.true')
    cy.get('[data-cy="product-price"]').should('have.prop', 'validity').its('valueMissing').should('be.true')
    cy.get('[data-cy="product-stock"]').should('have.prop', 'validity').its('valueMissing').should('be.true')
    cy.get('[data-cy="product-minimum-stock"]').should('have.prop', 'validity').its('valueMissing').should('be.true')
  })

  it('9a. não aceita preço negativo', () => {
    cy.visit('/produtos/create')
    cy.get('[data-cy="product-price"]').type('-1')
    cy.get('[data-cy="product-price"]').should('have.prop', 'validity').its('rangeUnderflow').should('be.true')
  })

  it('9b. não aceita estoque negativo', () => {
    cy.visit('/produtos/create')
    cy.get('[data-cy="product-stock"]').type('-1')
    cy.get('[data-cy="product-stock"]').should('have.prop', 'validity').its('rangeUnderflow').should('be.true')
  })

  it('9c. mantém campos numéricos sem texto inválido', () => {
    cy.visit('/produtos/create')
    cy.get('[data-cy="product-price"]').type('texto')
    cy.get('[data-cy="product-price"]').should('have.value', '')
  })

  it('10. edita o preço de um produto existente', () => {
    cy.fixture('produto').then((produto) => {
      cy.criarProduto(produto)
      cy.contains('tr', produto.name).contains('Editar').click()
      cy.get('[data-cy="product-price"]').clear().type('15.75')
      cy.get('[data-cy="save-product"]').click()
      cy.location('pathname').should('eq', '/produtos')
      cy.contains('tr', produto.name).should('contain.text', '15,75')
    })
  })

  it('11. cadastra e exclui um produto', () => {
    cy.fixture('produto').then((produto) => {
      cy.criarProduto({ ...produto, name: 'Produto para excluir' })
      cy.on('window:confirm', () => true)
      cy.contains('tr', 'Produto para excluir').contains('Excluir').click()
      cy.contains('Produto para excluir').should('not.exist')
    })
  })

  it('12. cria, edita e exclui um cliente com contato e endereço', () => {
    cy.fixture('cliente').then((cliente) => {
      cy.criarCliente(cliente)
      cy.contains('tr', cliente.name).contains('Editar').click()
      cy.get('[data-cy="customer-name"]').clear().type('Cliente Cypress Editado')
      cy.get('[data-cy="save-customer"]').click()
      cy.contains('tr', 'Cliente Cypress Editado').within(() => {
        cy.on('window:confirm', () => true)
        cy.contains('Excluir').click()
      })
      cy.contains('Cliente Cypress Editado').should('not.exist')
    })
  })

  it('13. identifica estoque baixo e ausência de alerta acima do mínimo', () => {
    cy.fixture('produto').then((produto) => {
      cy.criarProduto({ ...produto, name: 'Estoque baixo', stock: 1, minimum_stock: 5 })
      cy.contains('tr', 'Estoque baixo').find('.badge').should('have.attr', 'style').and('include', '#ffe0d7')
      cy.criarProduto({ ...produto, name: 'Estoque normal', stock: 10, minimum_stock: 5 })
      cy.contains('tr', 'Estoque normal').find('.badge').should('not.have.css', 'background-color', 'rgb(255, 224, 215)')
    })
  })

  it('14. carrega fixtures de produto e cliente', () => {
    cy.fixture('produto').should('have.property', 'name', 'Cupcake de teste')
    cy.fixture('cliente').should('have.property', 'email', 'cypress@example.com')
  })

  it('15. reutiliza comandos de cadastro de produto e cliente', () => {
    cy.fixture('produto').then((produto) => cy.criarProduto(produto))
    cy.fixture('cliente').then((cliente) => cy.criarCliente(cliente))
    cy.contains('Cliente Cypress').should('be.visible')
  })

  it('16. percorre a paginação e permite voltar à página anterior', () => {
    cy.fixture('produto').then((produto) => {
      Cypress._.times(11, (index) => cy.criarProduto({ ...produto, name: `Produto página ${index + 1}` }))
      cy.visit('/produtos')
      cy.get('table tbody tr').first().invoke('text').then((firstPage) => {
        cy.get('a[rel="next"]').click()
        cy.url().should('include', 'page=2')
        cy.get('table tbody tr').first().invoke('text').should('not.equal', firstPage)
        cy.get('a[rel="prev"]').click()
        cy.url().should('not.include', 'page=2')
      })
    })
  })

  it('17. cria cliente, produto e pedido e verifica a baixa correta do estoque', () => {
    cy.fixture('cliente').then((cliente) => cy.criarCliente(cliente))
    cy.fixture('produto').then((produto) => cy.criarProduto({ ...produto, stock: 20 }))
    cy.visit('/pedidos/create')
    cy.get('select[name="customer_id"]').select('Cliente Cypress')
    selectOptionContaining('select[name="product_id"]', 'Cupcake de teste')
    cy.get('input[name="quantity"]').clear().type('3')
    cy.get('select[name="status"]').select('confirmed')
    cy.get('form').submit()
    cy.location('pathname').should('eq', '/pedidos')
    cy.contains('Cupcake de teste (3)').should('be.visible')
    cy.visit('/produtos')
    cy.contains('tr', 'Cupcake de teste').should('contain.text', '17 un.')
  })

  it('18. rejeita pedido cuja quantidade excede o estoque disponível', () => {
    cy.fixture('cliente').then((cliente) => cy.criarCliente(cliente))
    cy.fixture('produto').then((produto) => cy.criarProduto({ ...produto, stock: 2 }))
    cy.visit('/pedidos/create')
    cy.get('select[name="customer_id"]').select('Cliente Cypress')
    selectOptionContaining('select[name="product_id"]', 'Cupcake de teste')
    cy.get('input[name="quantity"]').clear().type('3')
    cy.get('select[name="status"]').select('pending')
    cy.get('form').submit()
    cy.contains('Estoque insuficiente para este produto.').should('be.visible')
    cy.visit('/pedidos')
    cy.contains('Cupcake de teste').should('not.exist')
  })

  it('19. cria um frete e atualiza o status até a entrega', () => {
    cy.fixture('cliente').then((cliente) => cy.criarCliente(cliente))
    cy.fixture('produto').then((produto) => cy.criarProduto(produto))
    cy.visit('/pedidos/create')
    cy.get('select[name="customer_id"]').select('Cliente Cypress')
    selectOptionContaining('select[name="product_id"]', 'Cupcake de teste')
    cy.get('input[name="quantity"]').clear().type('1')
    cy.get('select[name="status"]').select('confirmed')
    cy.get('form').submit()
    cy.visit('/entregas/create')
    cy.get('select[name="order_id"]').select('1')
    cy.get('input[name="address"]').type('Rua dos Testes, 10')
    cy.get('input[name="city"]').type('São Paulo')
    cy.get('input[name="fee"]').clear().type('8.5')
    cy.get('input[name="scheduled_at"]').type('2026-11-01')
    cy.get('input[name="tracking_code"]').type('CY-123')
    cy.get('form').submit()
    cy.contains('tr', 'scheduled').should('be.visible')
    cy.contains('tr', 'scheduled').contains('Editar').click()
    cy.get('select[name="status"]').select('in_transit')
    cy.get('form').submit()
    cy.contains('tr', 'in_transit').should('be.visible')
    cy.contains('tr', 'in_transit').contains('Editar').click()
    cy.get('select[name="status"]').select('delivered')
    cy.get('form').submit()
    cy.contains('tr', 'delivered').should('be.visible')
  })

  it('20. intercepta o POST de pedido e conclui o fluxo E2E até o frete', () => {
    cy.fixture('cliente').then((cliente) => cy.criarCliente(cliente))
    cy.fixture('produto').then((produto) => cy.criarProduto(produto))
    cy.intercept('POST', '**/pedidos').as('createOrder')
    cy.visit('/pedidos/create')
    cy.get('select[name="customer_id"]').select('Cliente Cypress')
    selectOptionContaining('select[name="product_id"]', 'Cupcake de teste')
    cy.get('input[name="quantity"]').clear().type('2')
    cy.get('select[name="status"]').select('pending')
    cy.get('form').submit()
    cy.wait('@createOrder').its('response.statusCode').should('eq', 302)
    cy.visit('/entregas/create')
    cy.get('select[name="order_id"]').select('1')
    cy.get('input[name="address"]').type('Rua dos Testes, 10')
    cy.get('input[name="city"]').type('São Paulo')
    cy.get('input[name="fee"]').clear().type('8.5')
    cy.get('select[name="status"]').select('scheduled')
    cy.get('form').submit()
    cy.contains('tr', 'scheduled').should('be.visible')
  })
})
