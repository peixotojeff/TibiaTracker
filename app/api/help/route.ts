import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, message } = body;

    // Validação básica
    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Assunto e mensagem são obrigatórios' },
        { status: 400 }
      );
    }

    // Aqui você pode adicionar a lógica de envio de email
    // Por enquanto, apenas registramos no console
    console.log('Nova mensagem de ajuda recebida:');
    console.log('Assunto:', subject);
    console.log('Mensagem:', message);
    console.log('Data:', new Date().toISOString());

    // Simulando um envio bem-sucedido
    // Você pode integrar com serviços como SendGrid, Mailgun, etc.
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Mensagem recebida com sucesso' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}
