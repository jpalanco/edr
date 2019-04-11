// Manage Velociraptor's CA and key signing.
package crypto

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"math/big"
	"time"

	errors "github.com/pkg/errors"
	api_proto "www.velocidex.com/golang/velociraptor/api/proto"
	logging "www.velocidex.com/golang/velociraptor/logging"
)

type CertBundle struct {
	Cert       string
	PrivateKey string
}

func GenerateCACert(rsaBits int) (*CertBundle, error) {
	priv, err := rsa.GenerateKey(rand.Reader, rsaBits)
	if err != nil {
		return nil, err
	}

	start_time := time.Now()
	end_time := start_time.Add(365 * 24 * time.Hour)

	serialNumberLimit := new(big.Int).Lsh(big.NewInt(1), 128)
	serialNumber, err := rand.Int(rand.Reader, serialNumberLimit)
	if err != nil {
		return nil, err
	}

	template := x509.Certificate{
		SerialNumber: serialNumber,
		Subject: pkix.Name{
			Organization: []string{"Velociraptor CA"},
		},
		NotBefore: start_time,
		NotAfter:  end_time,

		KeyUsage: x509.KeyUsageKeyEncipherment |
			x509.KeyUsageDigitalSignature |
			x509.KeyUsageCertSign,
		ExtKeyUsage: []x509.ExtKeyUsage{
			x509.ExtKeyUsageServerAuth,
			x509.ExtKeyUsageClientAuth,
		},
		BasicConstraintsValid: true,
		DNSNames:              []string{"Velociraptor_ca.velocidex.com"},
		IsCA:                  true,
	}

	derBytes, err := x509.CreateCertificate(
		rand.Reader, &template, &template,
		&priv.PublicKey,
		priv)

	if err != nil {
		return nil, errors.WithStack(err)
	}

	return &CertBundle{
		PrivateKey: string(pem.EncodeToMemory(
			&pem.Block{
				Type:  "RSA PRIVATE KEY",
				Bytes: x509.MarshalPKCS1PrivateKey(priv),
			},
		)),
		Cert: string(pem.EncodeToMemory(
			&pem.Block{
				Type:  "CERTIFICATE",
				Bytes: derBytes,
			},
		)),
	}, nil
}

func GenerateServerCert(config_obj *api_proto.Config, name string) (*CertBundle, error) {
	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return nil, err
	}

	start_time := time.Now()
	end_time := start_time.Add(365 * 24 * time.Hour)

	serial_number := big.NewInt(1)
	old_cert, err := parseX509CertFromPemStr([]byte(
		config_obj.Frontend.Certificate))
	if err == nil {
		serial_number.Add(serial_number, old_cert.SerialNumber)
		logging.GetLogger(config_obj, &logging.FrontendComponent).Info(
			"Incremented server serial number to %v", serial_number)
	}

	ca_cert, err := parseX509CertFromPemStr([]byte(
		config_obj.Client.CaCertificate))
	if err != nil {
		return nil, err
	}

	ca_private_key, err := parseRsaPrivateKeyFromPemStr(
		[]byte(config_obj.CA.PrivateKey))
	if err != nil {
		return nil, err
	}

	template := x509.Certificate{
		SerialNumber: serial_number,
		Subject: pkix.Name{
			CommonName:   name,
			Organization: []string{"Velociraptor"},
		},
		NotBefore: start_time,
		NotAfter:  end_time,

		KeyUsage: x509.KeyUsageKeyEncipherment |
			x509.KeyUsageDigitalSignature,
		ExtKeyUsage: []x509.ExtKeyUsage{
			x509.ExtKeyUsageServerAuth,
			x509.ExtKeyUsageClientAuth,
		},
		BasicConstraintsValid: true,
	}

	derBytes, err := x509.CreateCertificate(
		rand.Reader, &template, ca_cert,
		&priv.PublicKey,
		ca_private_key)

	if err != nil {
		return nil, errors.WithStack(err)
	}

	return &CertBundle{
		PrivateKey: string(pem.EncodeToMemory(
			&pem.Block{
				Type:  "RSA PRIVATE KEY",
				Bytes: x509.MarshalPKCS1PrivateKey(priv),
			},
		)),
		Cert: string(pem.EncodeToMemory(
			&pem.Block{
				Type:  "CERTIFICATE",
				Bytes: derBytes,
			},
		)),
	}, nil
}
