const radioSim = document.querySelector(
    'input[name="possui_responsavel"][value="sim"]'
);

const radioNao = document.querySelector(
    'input[name="possui_responsavel"][value="nao"]'
);

const secaoResponsavel = document.getElementById("secao-responsavel");
const secaoEnderecoResponsavel = document.getElementById(
    "secao-endereco-responsavel"
);

// Lista de json para realizar o fetch
let listaResponsaveis = []
let idAluno = 0
let idResponsavies = []

// Esconde as seções de responsável
function esconderResponsavel() {
    secaoResponsavel.style.display = "none";
    secaoEnderecoResponsavel.style.display = "none";
    secaoResponsavaisCadastrados.style.display = "none";
}


// Mostra as seções de responsável
function mostrarResponsavel() {
    secaoResponsavel.style.display = "block";
    secaoEnderecoResponsavel.style.display = "block";
    secaoResponsavaisCadastrados.style.display = "block";
}


// Quando selecionar "Sim"
radioSim.addEventListener("change", function () {
    mostrarResponsavel();
});


// Quando selecionar "Não"
radioNao.addEventListener("change", function () {
    esconderResponsavel();
});


// Começa com as seções escondidas
esconderResponsavel();


async function cadastrar() {
    nome = input_nome.value.trim()
    dt_nascimento = input_dt_nascimento.value.trim()
    email = input_email.value.trim()
    senha = input_senha.value.trim()
    confirmacao_senha = input_confirmacao_senha.value.trim()
    cep = input_cep.value.trim().replace("-", "")
    numero = input_numero.value.trim()
    logradouro = input_logradouro.value.trim()
    if (nome == null || nome == "") {
        alert("Preencha o nome")
    } else if (dt_nascimento == null || dt_nascimento == "") {
        alert("Preencha a data de nascimento")
    } else if (email == null || email == "") {
        alert("Preencha o email")
    } else if (!email.includes('@') || !email.includes('.')) {
        alert("O email deve possuir '@' e '.' ")
    } else if (senha == null || senha == "") {
        alert("Preencha a senha")
    } else if (confirmacao_senha == null || confirmacao_senha == "") {
        alert("Preencha a confirmação de senha")
    } else if (cep == null || cep == "") {
        alert("Preencha o cep")
    } else if (numero == null || numero == "") {
        alert("Preencha o numero")
    } else if (logradouro == null || logradouro == "") {
        alert("Preencha todos o Logradouro")
    } else if (senha != confirmacao_senha) {
        alert("Senha e confirmação de senha devem ser iguais")
    } else {
        var aluno = {
            "Aluno": {
                "nome": nome,
                "dataNascimento": dt_nascimento,
                "email": email,
                "senha": senha,
            },
            "Endereco": {
                "cep": cep,
                "numero": numero,
                "logradouro": logradouro
            }
        }
        await cadastrarPersona(aluno, "aluno")
        await cadastrarTodosResponsaveis()
        await vincularAlunoResponsaveis()
        finalizarCadastro()
    }
}


// Lista os responsaveis para cadastrar e manda para a função cadastrar responsavel
async function cadastrarTodosResponsaveis() {
    for (var i = 0; i < listaResponsaveis.length; i++) {
        var responsavel = listaResponsaveis[i]
        await cadastrarPersona(responsavel, "responsavel")
    }
}

// Cadastra Responsavel
async function cadastrarPersona(persona, tipo) {
    try {
        const respostaEndereco = await fetch("http://localhost:8080/api/enderecos", {
            method: "POST",
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({
                "rua": persona.Endereco.logradouro,
                "cep": persona.Endereco.cep,
                "numero": persona.Endereco.numero
            })
        })
        if (!respostaEndereco.ok) {
            throw new Error("Erro ao cadastrar Endereço")
        }

        const endereco = await respostaEndereco.json()

        if (tipo == "responsavel") {
            const respostaResponsavel = await fetch("http://localhost:8080/api/responsaveis", {
                method: "POST",
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({
                    "nome": persona.Responsavel.nomeResp,
                    "telefone": persona.Responsavel.telefoneResp,
                    "enderecoIdEndereco": endereco.idEndereco
                })
            })
            const resposta = await respostaResponsavel.json()
            idResponsavies.push(resposta.idResponsavel)
            return resposta
        } else if (tipo == "aluno") {
            const respostaAluno = await fetch("http://localhost:8080/api/alunos", {
                method: "POST",
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({
                    "nome": persona.Aluno.nome,
                    "dataNascimento": persona.Aluno.dataNascimento,
                    "email": persona.Aluno.email,
                    "senha": persona.Aluno.senha,
                    "enderecoIdEndereco": endereco.idEndereco
                })
            })

            const resposta = await respostaAluno.json()
            idAluno = resposta.idAluno
            return resposta
        } else {
            console.error("Tipo de persona não encontrado")
        }
    } catch (e) {
        console.error("Erro ao cadastrar o responsavel: " + e)
    }
}


// vincular alunos responsavies
async function vincularAlunoResponsaveis() {
    console.log(idResponsavies.length)
    for (var i = 0; i < idResponsavies.length; i++) {
        console.log(i)
        fetch("http://localhost:8080/api/alunos-responsaveis", {
            method: "POST",
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({
                "fkAluno": idAluno,
                "fkResponsavel": idResponsavies[i]
            })
        })
            .then(function (resposta) {
                console.log("resposta: ", resposta);
                if (!resposta.ok) {
                    throw "Houve um erro ao tentar realizar o cadastro do anuncio!";
                }
            })
            .catch(function (resposta) {
                console.log(`#ERRO: ${resposta}`);
            });
    }
}


// Adiciona outro responsavel a lista
function adicionarOutroResponsavel() {
    nome_responsavel = input_nome_responsavel.value.trim()
    telefone_responsavel = input_telefone.value.trim().replace("(", "").replace(")", "").replace("-", "").replaceAll(" ", "")
    cep_responsavel = input_cep_responsavel.value.trim().replace("-", "")
    numero_responsavel = input_numero_responsavel.value.trim()
    logradouro_responsavel = input_logradouro_responsavel.value.trim()
    if (
        nome_responsavel == null || nome_responsavel == "" ||
        telefone_responsavel == null || telefone_responsavel == "" ||
        cep_responsavel == null || cep_responsavel == "" ||
        numero_responsavel == null || numero_responsavel == "" ||
        logradouro_responsavel == null || logradouro_responsavel == ""
    ) {
        alert("Preencha todos os campos")
        return
    }
    listaResponsaveis.push(
        {
            "Responsavel": {
                "nomeResp": nome_responsavel,
                "telefoneResp": telefone_responsavel
            },
            "Endereco": {
                "cep": cep_responsavel,
                "numero": numero_responsavel,
                "logradouro": logradouro_responsavel
            }
        }
    )
    atualizarListaResponsaveis()
    limparFormularioResponsavel()
}


// Atualiza o html de lista de responsavel
function atualizarListaResponsaveis() {
    var cards = ""
    for (var i = 0; i < listaResponsaveis.length; i++) {
        var responsavel = listaResponsaveis[i].Responsavel
        var endereco = listaResponsaveis[i].Endereco
        cards += `<div class="card-responsavel">
                        <div class="card-responsavel-topo">
                            <span class="card-responsavel-titulo"> Responsável ${i + 1} </span>
                            <button type="button" class="btn-remover" onclick="removerResponsavelPorIndice(${i})"> Remover </button>
                        </div>
                        <div class="card-responsavel-conteudo">
                            <div class="dado-responsavel">
                                <span class="dado-label">Nome</span>
                                <span class="dado-valor">${responsavel.nomeResp}</span>
                            </div>
                            <div class="dado-responsavel"> 
                                <span class="dado-label">Telefone</span> 
                                <span class="dado-valor">${responsavel.telefoneResp}</span>
                            </div>
                            <div class="dado-responsavel">
                                <span class="dado-label">CEP</span>
                                <span class="dado-valor">${endereco.cep}</span>
                            </div>
                            <div class="dado-responsavel">
                                <span class="dado-label">Número</span>
                                <span class="dado-valor">${endereco.numero}</span>
                            </div>
                            <div class="dado-responsavel logradouro">
                                <span class="dado-label">Logradouro</span>
                                <span class="dado-valor">${endereco.logradouro}</span>
                            </div>
                        </div>
                    </div>`
    }
    containerListaResponsaveis.innerHTML = cards
}


// remove um responsavel da lista
function removerResponsavelPorIndice(indice) {
    console.log(indice)
    let listaTemporaria = []
    for (var i = 0; i < listaResponsaveis.length; i++) {
        if (i != indice) {
            listaTemporaria.push(
                {
                    "Responsavel": {
                        "nomeResp": listaResponsaveis[i].Responsavel.nomeResp,
                        "telefoneResp": listaResponsaveis[i].Responsavel.telefoneResp
                    },
                    "EnderecoResponsavel": {
                        "cepResp": listaResponsaveis[i].EnderecoResponsavel.cepResp,
                        "numeroResp": listaResponsaveis[i].EnderecoResponsavel.numeroResp,
                        "logradouroResp": listaResponsaveis[i].EnderecoResponsavel.logradouroResp
                    }
                }
            )
        }
    }
    listaResponsaveis = listaTemporaria
    atualizarListaResponsaveis()
}


// limpa formularios
function finalizarCadastro() {
    limparFormularioResponsavel()
    limparFormularioAluno()
    limparVariaveis()
    atualizarListaResponsaveis()
    alert("Aluno cadastrado com sucesso")
}

function limparFormularioResponsavel() {
    input_nome_responsavel.value = ""
    input_telefone.value = ""
    input_cep_responsavel.value = ""
    input_numero_responsavel.value = ""
    input_logradouro_responsavel.value = ""
}

function limparFormularioAluno() {
    input_nome.value = ""
    input_dt_nascimento.value = ""
    input_email.value = ""
    input_senha.value = ""
    input_confirmacao_senha.value = ""
    input_cep.value = ""
    input_numero.value = ""
    input_logradouro.value = ""
}

function limparVariaveis() {
    listaResponsaveis = []
    idAluno = 0
    idResponsavies = []
}


// // Formatação
// input_telefone.addEventListener("input", (event) => {
//     var tellCell = input_telefone.value
//     var tamanho = tellCell.length
//     var tellCellFormatado = ''
//     for (var i = 1; i <= tamanho; i++) {
//         if (i == 1 && tellCell[i - 1] != '(') {
//             tellCellFormatado += '('
//         } else if (i == 4 && tellCell[i - 1] != ')') {
//             tellCellFormatado += ')'
//         } else if (i == 5 && tellCell[i - 1] != ' ') {
//             tellCellFormatado += ' '
//         } else if (i == 11 && tellCell[i - 1] != '-') {
//             tellCellFormatado += '-'
//         }
//         tellCellFormatado += tellCell[i - 1]
//     }
//     input_telefone.value = tellCellFormatado
// });

// input_cep_responsavel.addEventListener("input", (event) => {
//     var cep = input_cep_responsavel.value
//     var tamanho = cep.length
//     var cepFormatado = ''
//     for (var i = 1; i <= tamanho; i++) {
//         if (i % 6 == 0 && cep[i - 1] != '-') {
//             cepFormatado += '-'
//         }
//         cepFormatado += cep[i - 1]
//     }
//     input_cep_responsavel.value = cepFormatado
// });

// input_cep.addEventListener("input", (event) => {
//     var cep = input_cep.value
//     var tamanho = cep.length
//     var cepFormatado = ''
//     for (var i = 1; i <= tamanho; i++) {
//         if (i % 6 == 0 && cep[i - 1] != '-') {
//             cepFormatado += '-'
//         }
//         cepFormatado += cep[i - 1]
//     }
//     input_cep.value = cepFormatado
// });

