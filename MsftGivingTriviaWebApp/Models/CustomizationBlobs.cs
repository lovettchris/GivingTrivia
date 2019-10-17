using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.WindowsAzure.Storage.Blob;
using Microsoft.Azure;
using Microsoft.WindowsAzure.Storage;
using System.Runtime.Serialization.Json;
using System.Diagnostics;
using System.IO;

namespace MsftGivingTriviaWebApp.Models
{
    public class CustomizationBlobs
    {
        static Dictionary<string, byte[]> cache = new Dictionary<string, byte[]>();

        public static T GetCustomizationJson<T>(string name) where T: class
        {
            byte[] json = GetBlob(name);
            if (json != null)
            {
                MemoryStream stream = new MemoryStream(json);
                DataContractJsonSerializer s = new DataContractJsonSerializer(typeof(T));
                return (T)s.ReadObject(stream);
            }
            return null;
        }

        public static void UpdateCustomizationJson<T>(string name, T instance) where T: class
        {
            MemoryStream stream = new MemoryStream();
            DataContractJsonSerializer s = new DataContractJsonSerializer(typeof(T));
            s.WriteObject(stream, instance);

            byte[] bytes = stream.ToArray();
            cache[name] = bytes;

            UpdateBlob(name, bytes);
        }

        public static byte[] GetBlob(string name)
        {
            if (cache.ContainsKey(name))
            {
                return cache[name];
            }
            else
            {
                CloudBlobContainer container = GetCloudBlobContainer();
                CloudBlockBlob blob = container.GetBlockBlobReference(name);
                if (blob.Exists())
                {
                    MemoryStream stream = new MemoryStream();
                    blob.DownloadToStream(stream);
                    byte[] result = stream.ToArray();
                    cache[name] = result;
                    return result;
                }
            }
            return null;
        }

        public static void UpdateBlob(string name, byte[] data)
        {
            cache[name] = data;
            CloudBlobContainer container = GetCloudBlobContainer();
            CloudBlockBlob blob = container.GetBlockBlobReference(name);
            Uri location = blob.Uri;
            MemoryStream stream = new MemoryStream(data);
            blob.UploadFromStream(stream);
        }

        private static CloudBlobContainer GetCloudBlobContainer()
        {
            var connectionString = CloudConfigurationManager.GetSetting("AzureBlobStorageConnectionString");
            CloudStorageAccount storageAccount = CloudStorageAccount.Parse(connectionString);
            CloudBlobClient blobClient = storageAccount.CreateCloudBlobClient();
            CloudBlobContainer container = blobClient.GetContainerReference("customizationcontainer");
            if (!container.Exists())
            {
                if (container.CreateIfNotExists())
                {
                    Debug.WriteLine("Created customizationcontainer");
                }
            }
            return container;
        }

        public static byte[] ReadToEnd(Stream stream)
        {
            MemoryStream ms = new MemoryStream();
            const int BufferSize = 64000;
            byte[] buffer = new byte[BufferSize];
            int len = 0;
            do
            {
                len = stream.Read(buffer, 0, BufferSize);
                if (len > 0)
                {
                    ms.Write(buffer, 0, len);
                }
            }
            while (len > 0);
            return ms.ToArray();
        }
    }
}