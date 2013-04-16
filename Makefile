define REDIS_CONF
daemonize yes
port 6379
pidfile /tmp/redis1.pid
save ""
dir /tmp
endef

export REDIS_CONF
test:
	echo "$$REDIS_CONF" | /usr/local/bin/redis-server -
	- ./node_modules/.bin/_mocha --reporter spec -t 1000 -s 500 ${REGEX} ${TESTFILE}
	redis-cli -p 6379 shutdown

.PHONY: test
