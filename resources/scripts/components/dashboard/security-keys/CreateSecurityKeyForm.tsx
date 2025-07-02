import { Field, Form, Formik, FormikHelpers } from 'formik';
import { object, string } from 'yup';
import FormikFieldWrapper from '@elements/FormikFieldWrapper';
import SpinnerOverlay from '@elements/SpinnerOverlay';
import tw from 'twin.macro';
import { Button } from '@elements/button';
import Input from '@elements/Input';
import { useFlashKey } from '@/plugins/useFlash';
import { registerSecurityKey, useSecurityKeys } from '@/api/account/security-keys';

interface Values {
    name: string;
}

export default () => {
    const { clearAndAddHttpError } = useFlashKey('account');
    const { mutate } = useSecurityKeys();

    const submit = (values: Values, { setSubmitting, resetForm }: FormikHelpers<Values>) => {
        clearAndAddHttpError();

        registerSecurityKey(values.name)
            .then(key => {
                resetForm();
                mutate(data => (data || []).concat(key));
            })
            .catch(error => clearAndAddHttpError(error))
            .then(() => setSubmitting(false));
    };

    return (
        <>
            <Formik
                onSubmit={submit}
                initialValues={{ name: '' }}
                validationSchema={object().shape({
                    name: string().required(),
                })}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <SpinnerOverlay visible={isSubmitting} />
                        <FormikFieldWrapper label={'Security Key Name'} name={'name'} css={tw`mb-6`}>
                            <Field name={'name'} as={Input} />
                        </FormikFieldWrapper>
                        <div css={tw`flex justify-end mt-6`}>
                            <Button>Save</Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </>
    );
};
