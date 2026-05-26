FROM jenkins/jenkins:lts-jdk17

USER root

# Install prerequisites
RUN apt-get update && \
    apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        python3 \
        python3-pip \
        python3-venv \
        python3-full

# Install Docker CLI using Docker's convenience script
RUN curl -fsSL https://get.docker.com | sh


# Install Node.js (for frontend build steps)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Symlink python to python3 for convenience
RUN ln -s /usr/bin/python3 /usr/bin/python

USER jenkins
