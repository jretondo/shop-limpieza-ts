import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import puppeteer from 'puppeteer';

export const createListPricesPDF = async (
  productos: Array<any>,
): Promise<{
  filePath: string;
  fileName: string;
}> => {
  try {
    function base64_encode(file: any): string {
      const bitmap: Buffer = fs.readFileSync(file);
      return Buffer.from(bitmap).toString('base64');
    }

    const random = Math.floor(Math.random() * 1000);
    const fileName = `${random}-preciosList.pdf`;
    const location = path.join('public', 'prod-list', fileName);

    const logo = base64_encode(
      path.join('public', 'images', 'invoices', 'logo2.png'),
    );
    const myCss = fs.readFileSync(
      path.join('public', 'css', 'bootstrap.min.css'),
      'utf8',
    );

    // Construir la plantilla HTML
    const plantHtml = productos
      .map(
        (item) => `
      <div class="col-md-3" style="height: 120px;padding: 5px;">
        <div class="row" style="border: 2px solid black; height: 100%;margin-inline: 5px">
          <div class="col-md-12">
            <div class="col-md-12" style="height: 85%;">
              <h6 style="text-align: center;padding: 0;height: 40px;">
                ${item.name} (${item.subcategory})
              </h6>
            </div>
            <div class="col-md-12" style="height: 15%;bottom: 0;">
              <h4 style="text-align: center;padding: 0;">
                $ ${item.price}
              </h4>
            </div>
          </div>
        </div>
      </div>
    `,
      )
      .join('');

    const datos = {
      myCss: `<style>${myCss}</style>`,
      logo: 'data:image/png;base64,' + logo,
      productos: plantHtml,
    };

    const renderedHtml = await ejs.renderFile(
      path.join('views', 'reports', 'prices', 'index.ejs'),
      datos,
    );

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
    });

    const page = await browser.newPage();
    await page.setContent(renderedHtml, {
      waitUntil: 'networkidle0',
    });

    await page.pdf({
      path: location,
      landscape: true,
      format: 'legal',
      scale: 1,
      displayHeaderFooter: false,
      margin: {
        top: '0.5cm',
        bottom: '2cm',
      },
    });

    await browser.close();

    return { filePath: location, fileName };
  } catch (error) {
    console.error('Error al crear el PDF:', error);
    throw new Error('Algo salió mal al generar el PDF.');
  }
};
