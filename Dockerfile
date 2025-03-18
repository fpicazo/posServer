# Usa una imagen base oficial de Node.js
FROM node:22

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copia los archivos package.json y package-lock.json
COPY package*.json ./

# Instala las dependencias del proyecto
RUN npm install

# Copia el resto de la aplicación
COPY . .

# Usa un usuario seguro
USER node

# Expone el puerto en el que la aplicación está corriendo
EXPOSE 7507

# Define el comando por defecto para ejecutar la aplicación
CMD ["npm", "start"]