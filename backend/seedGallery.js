require('dotenv').config();
const mongoose = require('mongoose');
const Gallery = require('./models/Gallery');
const connectDB = require('./config/db');

const galleryImages = [
  {
    title: 'Guard of Honor Drill — NCC Camp, Aizawl',
    category: 'camps',
    imageUrl: 'assets/images/gallery/WhatsApp Image 2026-07-18 at 11.11.58 PM.jpeg'
  },
  {
    title: 'NCC Camp — Training Session',
    category: 'camps',
    imageUrl: 'assets/images/gallery/gallery-2.jpeg'
  },
  {
    title: 'NCC Training — Field Exercise',
    category: 'camps',
    imageUrl: 'assets/images/gallery/gallery-6.jpeg'
  },
  {
    title: 'NCC Group — Cadets Together',
    category: 'camps',
    imageUrl: 'assets/images/gallery/gallery-8.jpeg'
  },
  {
    title: 'Senior Cadets — Ceremonial Uniform & Medals',
    category: 'parades',
    imageUrl: 'assets/images/gallery/WhatsApp Image 2026-07-18 at 11.11.34 PM.jpeg'
  },
  {
    title: 'Cadet Contingent — Group Photo, Aizawl',
    category: 'parades',
    imageUrl: 'assets/images/gallery/WhatsApp Image 2026-07-18 at 11.13.18 PM.jpeg'
  },
  {
    title: 'NCC Parade — Drill Practice',
    category: 'parades',
    imageUrl: 'assets/images/gallery/gallery-3.jpeg'
  },
  {
    title: 'NCC Cultural Programme',
    category: 'parades',
    imageUrl: 'assets/images/gallery/gallery-7.jpeg'
  },
  {
    title: 'Drone Training Capsule — NCC DTE NER, Aizawl',
    category: 'activities',
    imageUrl: 'assets/images/gallery/WhatsApp Image 2026-07-18 at 11.11.57 PM.jpeg'
  },
  {
    title: 'NCC Activity — 15th Tripura Bn',
    category: 'activities',
    imageUrl: 'assets/images/gallery/gallery-1.jpeg'
  },
  {
    title: 'NCC Event — Battalion Meet',
    category: 'activities',
    imageUrl: 'assets/images/gallery/gallery-4.jpeg'
  },
  {
    title: 'Cadets at Govt. Zirtiri Residential Science College',
    category: 'events',
    imageUrl: 'assets/images/gallery/WhatsApp Image 2026-07-18 at 11.18.24 PM.jpeg'
  },
  {
    title: 'NCC Achievement — Award Ceremony',
    category: 'achievements',
    imageUrl: 'assets/images/gallery/gallery-5.jpeg'
  }
];

const seedGallery = async () => {
  try {
    await connectDB();
    
    // Clear existing gallery images
    await Gallery.deleteMany({});
    console.log('Existing gallery items deleted');

    // Insert new images
    await Gallery.insertMany(galleryImages);
    console.log('Gallery successfully seeded');

    process.exit();
  } catch (error) {
    console.error('Error seeding gallery:', error);
    process.exit(1);
  }
};

seedGallery();
