from cloudinary_storage.storage import MediaCloudinaryStorage

class NoDeleteCloudinaryStorage(MediaCloudinaryStorage):
    def delete(self, name):
        pass
