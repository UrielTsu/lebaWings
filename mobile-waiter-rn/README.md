# App Meseros (React Native) - Leba Wings

## Requisitos
- Node.js 18+
- Expo CLI (`npx create-expo-app`) o React Native CLI estándar
- Android Studio / Xcode o Expo Go en dispositivo físico.

## Instalación y Ejecución
1. Configurar dependencias en un proyecto Expo/RN:
   ```bash
   npm install react-native-safe-area-context expo-status-bar
   ```
2. Configurar la URL del backend en `src/services/api.ts`:
   ```typescript
   const API_BASE_URL = 'http://TU_IP_LOCAL:8000/api';
   ```
3. Iniciar la app:
   ```bash
   npx expo start
   ```
