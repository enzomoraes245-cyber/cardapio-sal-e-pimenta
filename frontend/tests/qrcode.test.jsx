import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QrCodePage } from '../src/features/qrcode/pages/QrCodePage.jsx';
import { QrCodePrintPage } from '../src/features/qrcode/pages/QrCodePrintPage.jsx';
import * as qrcodeService from '../src/features/qrcode/services/qrcode.service.js';

vi.mock('../src/features/qrcode/services/qrcode.service.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getQrCodeInfo: vi.fn(),
}));

const INFO = {
  slug: 'cantina',
  url: 'https://cardapio.exemplo.com.br/cardapio/cantina',
  restaurantName: 'Cantina São João',
  logoUrl: null,
  addressKind: 'public',
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

const renderPage = (element) => render(<MemoryRouter>{element}</MemoryRouter>);

describe('QrCodePage', () => {
  it('mostra o endereço, as ações e os arquivos para download', async () => {
    qrcodeService.getQrCodeInfo.mockResolvedValue(INFO);
    renderPage(<QrCodePage />);

    expect(await screen.findByText(INFO.url)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Copiar endereço' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Abrir cardápio/ }).getAttribute('href')).toBe(
      INFO.url,
    );

    const png = screen.getByRole('link', { name: 'Baixar PNG' });
    expect(png.getAttribute('href')).toBe('/api/v1/admin/qrcode/image.png?download=1');
    expect(png.getAttribute('download')).toBe('qrcode-cardapio-cantina.png');
    const svg = screen.getByRole('link', { name: 'Baixar SVG' });
    expect(svg.getAttribute('href')).toBe('/api/v1/admin/qrcode/image.svg?download=1');
    expect(svg.getAttribute('download')).toBe('qrcode-cardapio-cantina.svg');
    expect(screen.getByRole('link', { name: 'Imprimir folha A4' }).getAttribute('href')).toBe(
      '/admin/qrcode/impressao',
    );
    expect(screen.queryByText(/não distribua|só para testes/)).toBeNull();
  });

  it.each([
    ['local', 'http://localhost:5173', 'Endereço de teste: não distribua este QR Code'],
    ['private-network', 'http://192.168.0.10:5173', 'Endereço da rede local: use só para testes'],
  ])('avisa quando o endereço é %s', async (addressKind, origin, title) => {
    qrcodeService.getQrCodeInfo.mockResolvedValue({
      ...INFO,
      url: `${origin}/cardapio/cantina`,
      addressKind,
    });
    renderPage(<QrCodePage />);

    expect(await screen.findByText(title)).toBeTruthy();
    expect(screen.getByText(new RegExp(`aponta para ${new URL(origin).host},`))).toBeTruthy();
  });

  it('permite tentar de novo quando a imagem não carrega', async () => {
    qrcodeService.getQrCodeInfo.mockResolvedValue(INFO);
    renderPage(<QrCodePage />);
    const alt = `QR Code do cardápio de ${INFO.restaurantName}: ${INFO.url}`;

    fireEvent.error(await screen.findByAltText(alt));
    fireEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }));
    fireEvent.load(screen.getByAltText(alt));

    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).toBeNull();
  });
});

describe('QrCodePrintPage', () => {
  it('monta a folha A4 e só libera a impressão depois que o QR Code e o logotipo carregam', async () => {
    const print = vi.fn();
    vi.stubGlobal('print', print);
    const previousTitle = document.title;
    qrcodeService.getQrCodeInfo.mockResolvedValue({ ...INFO, logoUrl: '/uploads/logo.png' });
    const { unmount } = renderPage(<QrCodePrintPage />);

    const sheet = await screen.findByRole('article', { name: 'Folha A4 para impressão' });
    expect(within(sheet).getByRole('heading', { name: INFO.restaurantName })).toBeTruthy();
    expect(within(sheet).getByText(INFO.url)).toBeTruthy();
    expect(within(sheet).getByText(/Aponte a câmera do celular/)).toBeTruthy();
    const qr = within(sheet).getByAltText(`QR Code do cardápio: ${INFO.url}`);
    expect(qr.getAttribute('src')).toBe('/api/v1/admin/qrcode/image.svg');
    expect(document.title).toBe(`QR Code · ${INFO.restaurantName}`);

    const button = screen.getByRole('button', { name: 'Imprimir' });
    expect(button.disabled).toBe(true);
    fireEvent.load(qr);
    expect(button.disabled).toBe(true);
    fireEvent.load(within(sheet).getByAltText(`Logotipo de ${INFO.restaurantName}`));
    expect(button.disabled).toBe(false);

    fireEvent.click(button);
    expect(print).toHaveBeenCalledTimes(1);

    unmount();
    expect(document.title).toBe(previousTitle);
  });

  it('imprime sem o logotipo quando ele não carrega', async () => {
    qrcodeService.getQrCodeInfo.mockResolvedValue({ ...INFO, logoUrl: '/uploads/logo.png' });
    renderPage(<QrCodePrintPage />);

    fireEvent.load(await screen.findByAltText(`QR Code do cardápio: ${INFO.url}`));
    fireEvent.error(screen.getByAltText(`Logotipo de ${INFO.restaurantName}`));

    expect(screen.queryByAltText(`Logotipo de ${INFO.restaurantName}`)).toBeNull();
    expect(screen.getByRole('button', { name: 'Imprimir' }).disabled).toBe(false);
  });

  it('mantém a impressão bloqueada e oferece nova tentativa se o QR Code não carregar', async () => {
    qrcodeService.getQrCodeInfo.mockResolvedValue(INFO);
    renderPage(<QrCodePrintPage />);

    fireEvent.error(await screen.findByAltText(`QR Code do cardápio: ${INFO.url}`));

    expect(await screen.findByText('Não foi possível carregar o QR Code')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Imprimir' }).disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    fireEvent.load(screen.getByAltText(`QR Code do cardápio: ${INFO.url}`));
    expect(screen.queryByText('Não foi possível carregar o QR Code')).toBeNull();
    expect(screen.getByRole('button', { name: 'Imprimir' }).disabled).toBe(false);
  });
});
