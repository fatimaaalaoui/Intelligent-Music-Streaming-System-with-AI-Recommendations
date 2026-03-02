# Intelligent Music Streaming System with AI Recommendations

## Overview

This project is a full-stack music streaming platform enhanced with Artificial Intelligence to provide personalized music recommendations.

The system analyzes user behavior, listening history, and musical preferences to suggest relevant songs and artists. It simulates a real-world streaming environment where user interactions are continuously collected and used to improve recommendation quality.

This project demonstrates my ability to design and develop a complete data-driven application, combining backend development, database design, data processing, and machine learning integration.

---

## Main Features

- User authentication and profile management  
- Browse artists, albums, and tracks  
- Music search and filtering  
- Playlist creation and management  
- Listening history tracking  
- Like / Dislike system  
- Personalized AI-based recommendations  

---

## Data Source & Processing

Music data is collected from the **Jamendo API** and stored in MongoDB.

The data workflow includes:
- Extraction of music metadata (tracks, artists, albums)
- Data cleaning and genre enrichment
- Storage in MongoDB collections
- Collection of user interactions (history, likes, playlists)
- Use of interaction data for training recommendation models

This workflow reflects a real-world data engineering pipeline.

---

## Database (MongoDB)

The system stores both music content and user behavior.

**Main collections**
- tracks  
- artists  
- albums  
- users  
- playlists  
- listening_history  
- likes  
- dislikes  
- ml_recommendations  

User interactions are continuously collected and used to improve recommendation models.

---

## AI Recommendation System

The platform integrates multiple recommendation approaches:
- Content-Based Filtering (genres, tags, metadata)
- Item-to-Item Similarity
- Collaborative Filtering using SVD
- Hybrid model combining multiple strategies

**Machine Learning Workflow**
1. Collect user interaction data from MongoDB  
2. Train individual models (Content-based, Similarity, SVD)  
3. Combine results using a hybrid strategy  
4. Store generated recommendations in MongoDB  
5. Serve recommendations through the backend API  

---

## System Architecture

**Frontend (React)**
- Provides the user interface
- Allows browsing music, managing playlists, and interacting with the system

**Backend (Node.js / Express)**
- Exposes REST API endpoints
- Manages users, playlists, and user interactions
- Retrieves music data and recommendations from MongoDB

**Database (MongoDB)**
- Stores Jamendo music catalog
- Stores user interactions and preferences
- Stores machine learning recommendations

**Machine Learning Module (Python)**
- Trains recommendation models (Content, Item-Item, SVD, Hybrid)
- Generates personalized recommendations
- Updates results in MongoDB

Flow summary:

React Frontend  
→ Node.js / Express API  
→ MongoDB  

Python ML Module  
→ Reads data from MongoDB  
→ Generates recommendations  
→ Writes results back to MongoDB  

---

## Tech Stack

**Frontend**
- React

**Backend**
- Node.js
- Express

**Database**
- MongoDB

**Machine Learning**
- Python
- Pandas
- Scikit-learn

**Data Source**
- Jamendo API

---

## Project Structure

```text
music-streaming-ai-platform/
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   ├── recommendationService.js
│   ├── scripts/
│   │   ├── importJamendo.js
│   │   ├── sync_jamendo.js
│   │   ├── enrichGenres.js
│   │   ├── importYandexInteractions.js
│   │   ├── tracksBatch.js
│   │   ├── playlists_extra.js
│   │   ├── reco_seed.js
│   │   └── testJamendo.js
│   └── .env.example
│
├── ml-recommender/
│   ├── common.py
│   ├── train_content.py
│   ├── train_item_item.py
│   ├── train_svd.py
│   └── merge_hybrid.py
│
└── frontend/     # React application
```
## Project Goals

- Build a complete full-stack streaming platform integrating frontend, backend, database, and machine learning  
- Design a real-world recommendation system using user behavior and interaction data  
- Implement a data pipeline from Jamendo API ingestion to MongoDB storage and model training  
- Apply multiple recommendation techniques (Content-Based, Item-Item, SVD, Hybrid) to improve personalization  
- Structure the project in a modular way (data import scripts, ML training scripts, API services)  
- Demonstrate practical skills in Data Engineering, ML integration, and scalable application design  

---
## How to Run

### Backend
cd backend
npm install
npm start

### Frontend
cd frontend
npm install
npm run dev

## About Me

**Fatima Zahra Hamdi Alaoui**  
Junior Data & AI Engineer  

Interested in building intelligent, data-driven applications and scalable backend systems.
