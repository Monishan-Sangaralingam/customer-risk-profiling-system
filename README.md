# AI-Based Customer Profiling for Fraud Risk Prediction

For the free evaluation deployment, see [Deploy on Render](doc/RENDER.md).

A microservices-based system for **customer-level fraud risk prediction** using behavioral analytics and machine learning.  
Instead of focusing only on single suspicious transactions, this project evaluates the **customer’s overall behavior over time** to generate a dynamic fraud risk score. :contentReference[oaicite:0]{index=0}

---

## Overview

Fraud prevention should not start only after a suspicious transaction happens.  
This project is designed to build a **proactive fraud risk prediction system** that continuously analyzes customer transaction history, device usage, location patterns, and behavioral changes to estimate future fraud risk. :contentReference[oaicite:1]{index=1}

The system produces a **dynamic risk score** for each customer, helping financial institutions take early actions such as:

- closer monitoring
- additional authentication
- early intervention

---

## Problem Statement

Traditional fraud systems usually focus on **individual transactions**.  
However, fraudulent behavior can often be predicted earlier by observing:

- sudden spending increases
- unusual device changes
- new geographical locations
- abnormal transaction timing
- repeated declines or suspicious exposure patterns

This project addresses that problem by evaluating the **customer as a whole**, not just one transaction. :contentReference[oaicite:2]{index=2}

---

## Objectives

- Build a scalable **microservices-based fraud risk platform**
- Analyze customer behavioral history over time
- Generate a **risk score from 0 to 100**
- Categorize customers into **Low, Medium, or High risk**
- Trigger alerts when risk increases
- Generate reports for investigation and monitoring :contentReference[oaicite:3]{index=3}

---

## Microservices

This project is implemented using a microservices architecture with the following services:

### 1. Transaction Service
Responsible for:
- receiving and storing transaction data
- validating incoming transaction requests
- forwarding transaction-related data for downstream processing

### 2. Risk Score Service
Responsible for:
- calculating customer fraud risk scores
- combining engineered features with ML output
- classifying customers into risk categories

### 3. ML Service
Responsible for:
- training and serving the machine learning model
- predicting fraud risk based on customer behavior patterns
- supporting retraining with updated data

### 4. Alert Service
Responsible for:
- creating alerts for high-risk customers
- notifying when a customer moves to a higher risk band
- supporting proactive fraud monitoring

### 5. Report Service
Responsible for:
- generating daily / weekly / monthly reports
- showing high-risk customers for investigation
- supporting analytics and business insights

---

## System Workflow

1. A customer performs a transaction
2. The **Transaction Service** stores and processes the transaction
3. Behavioral and contextual features are derived
4. The **ML Service** predicts the customer risk tendency
5. The **Risk Score Service** calculates the updated fraud risk score
6. The customer is categorized as **Low / Medium / High risk**
7. The **Alert Service** generates alerts if risk increases
8. The **Report Service** produces summaries for monitoring and investigation

---

## Data Used

The system is designed to work with the following types of data:

- transaction frequency
- transaction value
- merchant categories
- device usage patterns
- geographical history
- chargeback and dispute history
- authentication outcomes such as 3DS results
- daily, weekly, and monthly aggregated behavioral data :contentReference[oaicite:4]{index=4}

---

## Feature Engineering

Important behavioral features include:

- average spending
- preferred merchant categories
- preferred geographies
- velocity of spending increase
- channel mix (eCommerce / POS / ATM)
- repeated declines
- high-risk MCC concentration
- changes in time-of-day activity
- rising decline ratios :contentReference[oaicite:5]{index=5}

These features help identify whether a customer’s current behavior is consistent with their normal profile.

---

## Machine Learning

The machine learning layer is used to identify patterns in customer behavior and generate a risk prediction.

### Model Goals
- group normal and abnormal customers
- estimate fraud risk level
- support dynamic score updates
- improve accuracy over time with retraining :contentReference[oaicite:6]{index=6}

### Expected Output
- customer risk score from **0 to 100**
- risk category:
  - **Low**
  - **Medium**
  - **High** :contentReference[oaicite:7]{index=7}

---

## Key Features

- Microservices-based architecture
- Customer-level fraud profiling
- Dynamic fraud risk score generation
- Machine learning integration
- Behavioral analysis over time
- Device and geography pattern tracking
- Alert generation for high-risk behavior
- Batch and periodic report generation
- Scalable and extensible design

---

## Tech Stack

### Backend
- Java
- Spring Boot
- REST APIs
- Microservices

### Machine Learning
- Python
- Pandas
- Scikit-learn

### Database
- MySQL / PostgreSQL

### Communication
- REST
- Kafka *(optional, if used for async communication)*

### Tools
- Git
- GitHub
- Maven
- Docker *(optional)*

---

## Project Structure

```text
fraud-risk-system/
│
├── transaction-service/
├── risk-score-service/
├── ml-service/
├── alert-service/
├── report-service/
│
├── docs/
├── README.md
└── docker-compose.yml
