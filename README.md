# Velociraptor - Endpoint visibility and collection tool.

Velociraptor is a tool for collecting host based state information
using Velocidex Query Language (VQL) queries.

Velociraptor is loosely based on Google's GRR technologies but is a
re-implementation and redesign focusing on ease of use, scalability
and flexibility.

To learn more about Velociraptor, read about it on our blog:

   https://docs.velociraptor.velocidex.com

## Quick start

1. Download the binary from the release page.
2. You need to generate a server config file. This will generate new key material:
    ```bash
    $ velociraptor config generate > /etc/velociraptor.config.yaml
    ```

3. Edit the config file and update any settings. In particular you
   would probably need to update the following:

   - Client.server_urls - the public-facing URLs to connect to the
     server.

   - Datastore.location and Datastore.filestore_directory - where to
     store files on the server.

4. To be able to log into the GUI you will need to make a user account
   with password.
    ```bash
    $ velociraptor --config /etc/velociraptor.config.yaml user add my_user_name
    ```

5. Start the server:
    ```bash
    $ velociraptor --config /etc/velociraptor.config.yaml frontend
    ```

6. Point a browser at the GUI port that you set in the config
   file. You should be able to log in with the password set earlier.

7. Generate a client config (this is just the client part of the
   server config you made before - it contains no secrets and can be
   installed on clients.):
    ```bash
    $ velociraptor --config /etc/velociraptor.config.yaml config client > client.conf.yaml
    ```

8. Launch the client on any system with this client config file.
    ```bash
    $ velociraptor --config client.conf.yaml client
    ```

9. You should be able to search for the client in the GUI, browse VFS,
   download files etc.

NOTE: You may omit the --config flag in the following cases:

 * If the VELOCIRAPTOR_CONFIG environment variable exists, Velociraptor
   will read its configuration from there.
 * If you embed the configuration into the binary (using velociraptor
   config repack as below), Velociraptor will magically know its own
   configuration without reading it from a file at all.

NOTE: If you embed the server's config into the binary then the binary
will have key material in it - this could pose a security issue if the
binary itself is leaked. It's OK to embed client config in the client because
client configs have no secrets.

To create a windows executable:

1. Embed the client config in the binary. This makes the binary self
   contained for your particular installation. It is therefore very
   easy to install:
    ```bash
    $ velociraptor config repack --exe velociraptor_windows.exe client.config.yaml my_velociraptor.exe
    ```
   Where velociraptor_windows.exe is the Windows binary release for
   Velociraptor.

2. If you need to sign the binary, now is the time. The signature will cover
   the embedded configuration as well. It is possible to update the embedded
   config but this will invalidate the signature.

2. On a windows system you can now install the service:
    ```bash
    $ my_velociraptor.exe service install
    INFO:2018/08/28 00:18:19 Stopped service Velociraptor
    INFO:2018/08/28 00:18:20 Copied binary to C:\Program Files\Velociraptor\Velociraptor.exe
    INFO:2018/08/28 00:18:20 Installed service Velociraptor
    INFO:2018/08/28 00:18:21 Started service Velociraptor
    ```

This will copy the binary into the install_dir specified in the config
file, create and start the service.

## Running Velociraptor locally.

Velociraptor is also useful as a local triage tool. In particular you
might find Velociraptor's artifacts especially useful for quickly
capturing important information about a running system. You can
collect artifacts by using the "artifacts collect" command:
    ```bash
    $ velociraptor artifacts list
    INFO:2018/08/20 22:28:56 Loaded 18 built in artifacts
    INFO:2018/08/20 22:28:56 Loaded 18 artifacts from artifacts/definitions/
    Linux.Applications.Chrome.Extensions
    Linux.Applications.Chrome.Extensions.Upload
    Linux.Applications.Docker.Info
    Linux.Applications.Docker.Version
    Linux.Debian.AptSources

    $ velociraptor artifacts list -v Linux.Debian.AptSources
    .... displays the artifacts

    $ velociraptor artifacts collect Linux.Debian.AptSources
    ... Collects all the named artifacts
    ```

Explore more of Velociraptor's options using the -h flag.

## Building from source.

To build from source, make sure you have a recent Golang installed
from https://golang.org/dl/:
    ```bash
    $ go get -u www.velocidex.com/golang/velociraptor
    $ go get -u github.com/golang/dep/cmd/dep
    $ cd $GO_PATH/go/src/www.velocidex.com/golang/velociraptor/

    # This will download go dependencies.
    $ dep ensure

    # This will build the GUI elements. You will need to have node
    # installed first. For example on Windows get it from
    # https://nodejs.org/en/download/ . You also need to have JAVA
    # installed from https://www.java.com because the js compiler
    # needs it.
    $ cd gui/static/
    $ npm install

    # If gulp is not on your path you need to run it using node:
    # node node_modules\gulp\bin\gulp.js compile
    $ gulp compile
    $ cd -

    # This builds a release (i.e. it will embed the GUI files in the
    # binary). If you dont care about the GUI a simple "make" will
    # build a bare binary.
    $ go run make.go -v dev
    $ go run make.go -v windows
    ```

If you want to rebuild the protobuf you will need to install protobuf compiler:
   ```bash
   $ wget https://github.com/protocolbuffers/protobuf/releases/download/v3.6.1/protoc-3.6.1-linux-x86_64.zip
   $ unzip protoc-3.6.1-linux-x86_64.zip
   $ sudo mv include/google/ /usr/local/include/
   $ sudo mv bin/protoc /usr/local/bin/
   $ go get github.com/golang/protobuf/protoc-gen-go/
   $ go install github.com/golang/protobuf/protoc-gen-go/
   $ go get github.com/grpc-ecosystem/grpc-gateway/protoc-gen-grpc-gateway
   $ go install github.com/grpc-ecosystem/grpc-gateway/protoc-gen-grpc-gateway
   $ ./make_proto.sh
   ```


## Getting help

Questions and feedback are welcome at velociraptor-discuss@googlegroups.com

File issues on https://gitlab.com/velocidex/velociraptor

Read more about Velociraptor on our blog:

https://docs.velociraptor.velocidex.com
