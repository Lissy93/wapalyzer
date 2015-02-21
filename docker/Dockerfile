FROM phusion/baseimage
MAINTAINER Elbert Alias <elbert@alias.io>

ENV DEBIAN_FRONTEND noninteractive

# Install packages
RUN apt-get update && apt-get install -y nodejs npm
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN ln -s /usr/bin/nodejs /usr/bin/node

RUN npm install jsonlint -g


# Add user
RUN useradd -ms /bin/bash wappalyzer && echo "wappalyzer:wappalyzer" | chpasswd
RUN echo 'wappalyzer ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers

WORKDIR /home/wappalyzer

RUN su wappalyzer -c "mkdir -p synced"

RUN echo "cd /home/wappalyzer/synced" >> .bashrc
RUN echo "export PATH=$PATH:/home/wappalyzer/synced/bin" >> .bashrc


# SSH
RUN rm -f /etc/service/sshd/down
RUN su wappalyzer -c "mkdir .ssh && chmod 700 .ssh"

ADD insecure.key.pub /tmp/insecure.key.pub

RUN su wappalyzer -c "cat /tmp/insecure.key.pub >> .ssh/authorized_keys && chmod 600 .ssh/authorized_keys" && rm -f /tmp/insecure.key.pub


# Fix the `stdin: is not a tty` error in Vagrant
RUN sed -i 's/^mesg n$/tty -s \&\& mesg n/g' /root/.profile


EXPOSE 22

RUN echo "/usr/sbin/sshd -D" > /etc/my_init.d/sshd.sh

CMD ["/sbin/my_init"]
