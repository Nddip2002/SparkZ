import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '../dist/generated/prisma/client.js';

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Error: Please provide DIRECT_URL or DATABASE_URL in .env before running seed.');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log('⚡ Seeding SparkZ Electronic Components catalog...');

  const sampleProducts = [
    {
      sku: 'SZ-MCU-ESP32-S3',
      mpn: 'ESP32-S3-WROOM-1',
      category: 'Microcontrollers',
      subcategory: 'WiFi & Bluetooth SoCs',
      manufacturer: 'Espressif Systems',
      name: 'ESP32-S3 Dual-Core Xtensa LX7 MCU Module (16MB Flash, 8MB PSRAM)',
      slug: 'esp32-s3-wroom-1-16mb',
      description: 'Powerful dual-core 32-bit MCU with 2.4 GHz Wi-Fi and Bluetooth 5 (LE) for AIoT edge computing, vector instructions, and neural network acceleration.',
      unitPrice: new Prisma.Decimal('449.00'),
      stockQuantity: 120,
      imageUrls: [
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
      ],
      datasheetUrl: 'https://www.espressif.com/sites/default/files/documentation/esp32-s3-wroom-1_wroom-1u_datasheet_en.pdf',
      specifications: {
        architecture: 'Xtensa LX7 32-bit',
        coreCount: 2,
        clockSpeed: '240 MHz',
        flashSize: '16 MB',
        sram: '512 KB',
        operatingVoltage: '3.0V - 3.6V',
        wireless: 'Wi-Fi 802.11 b/g/n + BLE 5.0',
        operatingTemperature: '-40°C to 85°C',
      },
      isActive: true,
    },
    {
      sku: 'SZ-MCU-STM32F401',
      mpn: 'STM32F401RET6',
      category: 'Microcontrollers',
      subcategory: 'ARM Cortex-M4',
      manufacturer: 'STMicroelectronics',
      name: 'STM32F401RE High-Performance ARM Cortex-M4 MCU (LQFP-64)',
      slug: 'stm32f401ret6-lqfp64',
      description: 'Dynamic efficiency line ARM Cortex-M4 core with DSP and FPU, operating at up to 84 MHz with zero-wait execution from flash memory.',
      unitPrice: new Prisma.Decimal('389.00'),
      stockQuantity: 85,
      imageUrls: [
        'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80',
      ],
      datasheetUrl: 'https://www.st.com/resource/en/datasheet/stm32f401re.pdf',
      specifications: {
        architecture: 'ARM Cortex-M4 w/ FPU',
        clockSpeed: '84 MHz',
        flashSize: '512 KB',
        sram: '96 KB',
        package: 'LQFP-64',
        supplyVoltage: '1.7V to 3.6V',
        timers: '8x (incl. advanced motor control)',
      },
      isActive: true,
    },
    {
      sku: 'SZ-MCU-RP2040',
      mpn: 'SC0914',
      category: 'Microcontrollers',
      subcategory: 'Dual Cortex-M0+',
      manufacturer: 'Raspberry Pi',
      name: 'Raspberry Pi Pico Development Board (RP2040)',
      slug: 'raspberry-pi-pico-rp2040',
      description: 'Flexible microcontroller board featuring the Raspberry Pi designed RP2040 silicon with unique programmable I/O (PIO) blocks.',
      unitPrice: new Prisma.Decimal('350.00'),
      stockQuantity: 240,
      imageUrls: [
        'https://images.unsplash.com/photo-1608564697071-ddf911d81370?auto=format&fit=crop&w=600&q=80',
      ],
      datasheetUrl: 'https://datasheets.raspberrypi.com/pico/pico-datasheet.pdf',
      specifications: {
        architecture: 'Dual-core ARM Cortex-M0+',
        clockSpeed: '133 MHz',
        sram: '264 KB',
        externalFlash: '2 MB QSPI',
        pioStateMachines: 8,
        adcChannels: '3x 12-bit',
      },
      isActive: true,
    },
    {
      sku: 'SZ-SEN-BME280',
      mpn: 'BME280',
      category: 'Sensors',
      subcategory: 'Environmental',
      manufacturer: 'Bosch Sensortec',
      name: 'BME280 Digital Combined Pressure, Humidity and Temperature Sensor',
      slug: 'bosch-bme280-sensor',
      description: 'Extremely compact digital sensor with fast response time and ultra-low noise measurements across barometric pressure, relative humidity, and temperature.',
      unitPrice: new Prisma.Decimal('279.00'),
      stockQuantity: 150,
      imageUrls: [
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      ],
      datasheetUrl: 'https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bme280-ds002.pdf',
      specifications: {
        interface: 'I2C / SPI',
        pressureRange: '300 to 1100 hPa',
        humidityRange: '0 to 100% r.H.',
        temperatureRange: '-40°C to +85°C',
        supplyVoltage: '1.71V - 3.6V',
        currentConsumption: '3.6 µA @ 1 Hz',
      },
      isActive: true,
    },
    {
      sku: 'SZ-PWR-AMS1117-33',
      mpn: 'AMS1117-3.3',
      category: 'Power Management',
      subcategory: 'LDO Regulators',
      manufacturer: 'Advanced Monolithic Systems',
      name: 'AMS1117 3.3V 1A Low Dropout Linear Voltage Regulator (SOT-223)',
      slug: 'ams1117-33v-ldo-sot223',
      description: 'Industry standard positive LDO regulator providing 3.3V fixed output with up to 1A output current and thermal/short-circuit protection.',
      unitPrice: new Prisma.Decimal('18.00'),
      stockQuantity: 1000,
      imageUrls: [
        'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=600&q=80',
      ],
      datasheetUrl: 'http://www.advanced-monolithic.com/pdf/ds1117.pdf',
      specifications: {
        outputVoltage: '3.3V Fixed',
        maxOutputCurrent: '1.0 A',
        dropoutVoltage: '1.1V @ 1A',
        package: 'SOT-223',
        inputVoltageMax: '15V',
      },
      isActive: true,
    },
    {
      sku: 'SZ-PAS-CAP-100NF',
      mpn: 'CC0805KRX7R9BB104',
      category: 'Passives',
      subcategory: 'Ceramic Capacitors',
      manufacturer: 'Yageo',
      name: '100nF (0.1µF) 50V X7R 0805 Surface Mount Ceramic Capacitor (Pack of 50)',
      slug: '100nf-50v-x7r-0805-50pack',
      description: 'High-stability X7R dielectric ceramic decoupling capacitor in standard 0805 package.',
      unitPrice: new Prisma.Decimal('45.00'),
      stockQuantity: 500,
      imageUrls: [
        'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80',
      ],
      datasheetUrl: 'https://www.yageo.com/upload/products/productsearch/datasheet/mlcc/UPY-GPHC_X7R_6.3V-to-50V_21.pdf',
      specifications: {
        capacitance: '100 nF (0.1 µF)',
        voltageRating: '50 V',
        dielectric: 'X7R',
        tolerance: '±10%',
        package: '0805 (2012 Metric)',
      },
      isActive: true,
    },
  ];

  for (const item of sampleProducts) {
    await prisma.product.upsert({
      where: { sku: item.sku },
      create: item,
      update: item,
    });
  }

  console.log(`✓ Seeded ${sampleProducts.length} components successfully.`);
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
